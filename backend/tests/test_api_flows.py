"""
End-to-end API tests (Auth, Onboarding Profile, Chat -> Local AI Service, Photo -> CV).

Uses:
  * an in-memory SQLite database instead of PostgreSQL
  * InMemoryChatHistoryStore instead of MongoDB
  * monkeypatched `ai_client` functions so no external AI server needs to run
"""

import base64
from typing import Any, Dict, List

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models.nutrition  # noqa: F401 - registers tables on Base
import app.models.user  # noqa: F401 - registers tables on Base
from app.main import app
from app.models.database import Base, get_db
from app.services import ai_client
from app.services.ai_client import AIServiceError, ChatCompletion
from app.services.chat_history import InMemoryChatHistoryStore, get_chat_store


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    # Avoid real TCP connection attempts to PostgreSQL during TestClient lifespan
    monkeypatch.setattr("app.main.init_postgres_db", lambda: None)

    chat_store = InMemoryChatHistoryStore()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_chat_store] = lambda: chat_store

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


ONBOARDING_PAYLOAD = {
    "weight_kg": 76.0,
    "height_cm": 180.0,
    "age": 22,
    "gender": "male",
    "does_sports": True,
    "sports_days_per_week": 3,
    "goal": "weight_loss",
    "calculation_basis": "current",
    "has_diabetes": True,
    "has_cholesterol": False,
    "has_hypertension": False,
}


def test_request_id_and_timing_headers(client: TestClient):
    res = client.get("/api/v1/health", headers={"X-Request-ID": "req-from-mobile-1"})
    assert res.status_code == 200
    assert res.headers["X-Request-ID"] == "req-from-mobile-1"
    assert float(res.headers["X-Process-Time-Ms"]) >= 0.0
    body = res.json()
    assert body["status"] == "online"
    assert body["chat_store"] == "memory"


def test_auth_register_login_refresh_and_onboarding_flow(client: TestClient):
    # 1. Register
    reg = client.post(
        "/api/v1/auth/register",
        json={"username": "ali_eren", "email": "ali@example.com", "password": "strongpassword123"},
    )
    assert reg.status_code == 201
    tokens = reg.json()
    assert tokens["user"]["is_onboarded"] is False
    access = tokens["access_token"]
    refresh = tokens["refresh_token"]
    headers = {"Authorization": f"Bearer {access}"}

    # Duplicate registration -> 409
    dup = client.post(
        "/api/v1/auth/register",
        json={"username": "ali_eren", "email": "other@example.com", "password": "strongpassword123"},
    )
    assert dup.status_code == 409

    # 2. Refresh token CANNOT be used as a Bearer access token
    bad_use = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {refresh}"})
    assert bad_use.status_code == 401

    # 3. Profile is 404 before onboarding
    assert client.get("/api/v1/users/me/profile", headers=headers).status_code == 404

    # 4. Calling /nutrition/calculate-bmr while logged in calculates AND saves the profile
    bmr_res = client.post("/api/v1/nutrition/calculate-bmr", json=ONBOARDING_PAYLOAD, headers=headers)
    assert bmr_res.status_code == 200
    bmr_data = bmr_res.json()
    assert bmr_data["activity_level"] == "moderate"

    me = client.get("/api/v1/auth/me", headers=headers).json()
    assert me["is_onboarded"] is True

    profile = client.get("/api/v1/users/me/profile", headers=headers).json()
    assert profile["target_calories"] == bmr_data["target_calories"]
    assert profile["has_diabetes"] is True

    # 5. Meal plan now uses the user's target_calories
    plan = client.get("/api/v1/nutrition/meal-plan", headers=headers).json()
    assert len(plan) == 7
    assert plan[0]["targetCalories"] == round(bmr_data["target_calories"])

    # 6. Refresh token rotation (matches mobile/src/services/api.ts -> tryRefreshSession)
    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert refreshed.status_code == 200
    new_access = refreshed.json()["access_token"]
    assert new_access != access

    # 7. Login by email or username
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "ALI@example.com", "password": "strongpassword123"},
    )
    assert login_res.status_code == 200


def test_chat_passes_profile_today_context_and_last_chats_to_ai_service(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    captured_payloads: List[Dict[str, Any]] = []

    async def fake_chat(payload: Dict[str, Any]) -> ChatCompletion:
        captured_payloads.append(payload)
        turn_no = len(captured_payloads)
        return ChatCompletion(text=f"AI cevabı #{turn_no}", model="qwen2.5-7b-local")

    monkeypatch.setattr(ai_client, "request_chat_completion", fake_chat)

    # Register + onboard so PostgreSQL has the user's profile
    tokens = client.post(
        "/api/v1/auth/register",
        json={"username": "bertan", "email": "bertan@example.com", "password": "strongpassword123"},
    ).json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    client.put("/api/v1/users/me/profile", json={**ONBOARDING_PAYLOAD, "full_name": "Bertan"}, headers=headers)

    today_context = {
        "targetCalories": 2292,
        "consumedCalories": 1400,
        "remainingCalories": 892,
        "consumedProtein": 95,
        "targetProtein": 172,
        "consumedCarbs": 130,
        "targetCarbs": 229,
        "consumedFat": 45,
        "targetFat": 76,
        "waterIntakeMl": 1500,
        "waterGoalMl": 2500,
        "goal": "weight_loss",
        "currentWeightKg": 76,
        "bmr": 1869,
        "recentMealNames": ["Yulaflı Omlet", "Izgara Tavuk"],
    }

    # --- Turn 1 ---
    r1 = client.post(
        "/api/v1/chat/message",
        json={"message": "Akşam ne yemeliyim?", "user_context": today_context},
        headers=headers,
    )
    assert r1.status_code == 200
    body1 = r1.json()
    assert body1["content"] == "AI cevabı #1"
    assert body1["model"] == "qwen2.5-7b-local"
    assert body1["safety_flag_triggered"] is False

    first_ai_call = captured_payloads[0]
    # System prompt contains BOTH the DB profile and today's live mobile context
    assert "Bertan" in first_ai_call["system_prompt"]
    assert "Diyabet / insülin direnci" in first_ai_call["system_prompt"]
    assert "892 kcal" in first_ai_call["system_prompt"]
    assert "Yulaflı Omlet, Izgara Tavuk" in first_ai_call["system_prompt"]
    assert first_ai_call["messages"] == [{"role": "user", "content": "Akşam ne yemeliyim?"}]

    # --- Turn 2 (mobile app does not even need to send session_id when logged in) ---
    r2 = client.post(
        "/api/v1/chat/message",
        json={"message": "Peki yanına çorba olur mu?", "user_context": today_context},
        headers=headers,
    )
    assert r2.status_code == 200
    assert r2.json()["session_id"] == body1["session_id"]

    second_ai_call = captured_payloads[1]
    assert second_ai_call["messages"] == [
        {"role": "user", "content": "Akşam ne yemeliyim?"},
        {"role": "assistant", "content": "AI cevabı #1"},
        {"role": "user", "content": "Peki yanına çorba olur mu?"},
    ]

    # --- History endpoint returns 4 messages (2 turns) & DELETE clears them ---
    hist = client.get("/api/v1/chat/history", headers=headers).json()
    assert len(hist["messages"]) == 4
    deleted = client.delete("/api/v1/chat/history", headers=headers).json()
    assert deleted["deleted_turns"] == 2
    assert client.get("/api/v1/chat/history", headers=headers).json()["messages"] == []


def test_chat_guardrail_blocks_prescription_and_flags_sensitive_topics(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    ai_calls: List[Dict[str, Any]] = []

    async def fake_chat(payload: Dict[str, Any]) -> ChatCompletion:
        ai_calls.append(payload)
        return ChatCompletion(text="Tansiyon için tuzu azaltın, doktorunuza danışın.", model="local-llm")

    monkeypatch.setattr(ai_client, "request_chat_completion", fake_chat)

    # 1. Hard block ("İlaç" with Turkish capital İ) -> AI service is NOT called
    blocked = client.post("/api/v1/chat/message", json={"message": "Diyabet için hangi İLACI almalıyım?"})
    assert blocked.status_code == 200
    data = blocked.json()
    assert data["safety_flag_triggered"] is True
    assert data["isMedicalWarning"] is True
    assert data["model"] == "guardrail"
    assert len(ai_calls) == 0

    # 2. Sensitive topic ("tansiyon") -> AI service IS called with extra safety instruction, flag is True
    sensitive = client.post("/api/v1/chat/message", json={"message": "Tansiyonum var, akşam ne yemeliyim?"})
    assert sensitive.status_code == 200
    s_data = sensitive.json()
    assert s_data["safety_flag_triggered"] is True
    assert s_data["isMedicalWarning"] is True
    assert len(ai_calls) == 1
    assert "EK GÜVENLİK TALİMATI" in ai_calls[0]["system_prompt"]


def test_photo_analysis_calls_ai_service_and_validates_base64(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    # Invalid base64 -> 400
    bad = client.post("/api/v1/nutrition/analyze-photo", json={"image_base64": "not-valid-base64!!!"})
    assert bad.status_code == 400

    async def fake_detect(payload: Dict[str, Any], request_id: str = "") -> Dict[str, Any]:
        return {
            "detected_items": [
                {
                    "food_name": "Mercimek Çorbası",
                    "estimated_grams": 250,
                    "confidence": 0.91,
                    "calories": 180,
                    "protein": 11.0,
                    "carbs": 27.0,
                    "fat": 3.0,
                    "allergens": ["gluten"],
                }
            ]
        }

    monkeypatch.setattr(ai_client, "request_food_detection", fake_detect)

    tiny_png = base64.b64encode(b"fake-image-bytes").decode("ascii")
    res = client.post(
        "/api/v1/nutrition/analyze-photo",
        json={"image_base64": f"data:image/jpeg;base64,{tiny_png}", "meal_type": "lunch"},
    )
    assert res.status_code == 200
    body = res.json()
    assert len(body["detectedFoods"]) == 1
    assert body["detectedFoods"][0]["foodName"] == "Mercimek Çorbası"
    assert body["detectedFoods"][0]["allergens"] == ["gluten"]
    assert body["totalNutrition"]["calories"] == 180.0


def test_ai_service_down_falls_back_cleanly(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    async def fail_chat(payload: Dict[str, Any]) -> ChatCompletion:
        raise AIServiceError("connection refused")

    monkeypatch.setattr(ai_client, "request_chat_completion", fail_chat)

    res = client.post("/api/v1/chat/message", json={"message": "Merhaba"})
    assert res.status_code == 200
    body = res.json()
    assert body["ai_available"] is False
    assert body["model"] == "offline-fallback"
