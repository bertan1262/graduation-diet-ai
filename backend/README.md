# 🧠 DietAI — Backend, Middleware & Local AI Orchestration Guide

Welcome to the **DietAI Backend** directory (`/backend`). This README is the **single technical source of truth** for the merged repository (`Mobile` + `Backend` + `Local AI Service`):
1. **Frontend / Mobile (`@Bertan`)** — exact endpoints, JWT auth + refresh, onboarding profile sync, meal plan, and chat/photo payloads aligned with `mobile/src/services/api.ts`.
2. **AI & CV Service (`@Eren`)** — exact HTTP JSON contracts (`GET /health`, `POST /api/v1/llm/chat`, `POST /api/v1/cv/detect`), how the backend builds `system_prompt` + `messages[]` from PostgreSQL + MongoDB + Mobile, and what `/ai-service` needs to implement next.

### ✅ Current Integration Status (Latest Commits)
* **Mobile (`/mobile`):** Merged into this branch (`frontend-and-mobile` up to `9325929`) — Bento Dashboard, 3-phase onboarding with dual BMR engine, hardware `expo-secure-store` JWT + auto-refresh, barcode scanner, recipe builder, allergen guardrails, and daily midnight rollover.
* **Backend (`/backend`):** Complete & verified (`12/12` `pytest` tests passing) — Polyglot DB (PostgreSQL 16 + MongoDB 7.0 with in-memory dev fallback), JWT Auth, Onboarding Profile persistence, Clinical BMR/TDEE/Exchanges, Turkish accent-insensitive Guardrails, MongoDB Chat Memory (`last 10 turns`), Dynamic System Prompt Builder, Photo CV Proxy, and `RequestContextMiddleware`.
* **AI Service (`/ai-service`):** Next to build — scaffold exists at `ai-service/server.py`; follow **Section 4** below to plug in the local LLM and food vision detector.

---

## 🗺️ 1. The Big Picture (How Frontend, Backend, Databases & Local AI Connect)

The **FastAPI Backend** acts as the central **Middleware & Context Orchestrator**:
* **PostgreSQL 16 (`SQLAlchemy 2.0`):** Stores structured accounts (`users`), onboarding clinical profiles (`user_profiles`), and meal logs (`meal_logs`).
* **MongoDB 7.0 (`Motor` + `Beanie ODM`):** Stores **conversation history ("last chats")** in the `chat_logs` collection, plus medical guardrail audit telemetry and a snapshot of the user's daily calorie state. *(If MongoDB isn't running locally during dev, the backend automatically falls back to an in-memory store so development never crashes).*
* **Local AI Microservice (`/ai-service` on port `8001`):** The backend **owns the system prompt and context assembly**. The AI service stays completely stateless — it receives a ready-to-run `system_prompt` and OpenAI/Ollama-style `messages` array (`user` / `assistant` history + current message) and simply runs the local model.

```mermaid
flowchart LR
    subgraph Mobile["📱 Mobile App (React Native)"]
        UI["Onboarding, Camera,\nChat & Dashboard"]
    end

    subgraph Backend["⚙️ FastAPI Backend (/backend :8000)"]
        MW["RequestContextMiddleware\n(X-Request-ID & Timing)"]
        AUTH["JWT Auth & Deps\n(app/api/deps.py)"]
        GUARD["Medical Guardrails\n(app/services/guardrails.py)"]
        PROMPT["System Prompt & Context Builder\n(app/services/prompt_builder.py)"]
        CALC["Clinical BMR/TDEE Engine\n(app/services/calculations.py)"]
    end

    subgraph Databases["🗄️ Polyglot Databases"]
        PG[("🐘 PostgreSQL 16\nusers, user_profiles,\nmeal_logs")]
        MONGO[("🍃 MongoDB 7.0\nchat_logs\n(Last Chats Memory)")]
    end

    subgraph AIService["🤖 Local AI Service (/ai-service :8001)"]
        LLM["POST /api/v1/llm/chat\n(Local LLM Runner)"]
        CV["POST /api/v1/cv/detect\n(Food Vision Detector)"]
    end

    UI <-->|"JSON + Bearer JWT"| MW
    MW --> AUTH
    AUTH <--> PG
    AUTH --> GUARD
    GUARD <-->|"Load last N turns &\nsave new turn"| MONGO
    GUARD --> PROMPT
    PROMPT <-->|"system_prompt +\nmessages[]"| LLM
    AUTH <-->|"Base64 Food Photo"| CV
    AUTH --> CALC
```

---

## 📁 2. Backend Folder Structure

```text
backend/
├── app/
│   ├── main.py                        # FastAPI app, lifespan (DB init), CORS & middleware registration
│   ├── core/
│   │   ├── config.py                  # Env settings (JWT, PostgreSQL, MongoDB, Local AI URLs & timeouts)
│   │   ├── security.py                # bcrypt password hashing & JWT access/refresh token helpers
│   │   └── middleware.py              # RequestContextMiddleware (X-Request-ID, X-Process-Time-Ms) & DB error handlers
│   ├── api/
│   │   ├── deps.py                    # FastAPI auth dependencies (get_current_user, get_optional_user)
│   │   └── v1/
│   │       ├── api.py                 # Registers /health, /auth, /users, /nutrition, /chat routers
│   │       └── endpoints/
│   │           ├── health.py          # GET  /api/v1/health (checks chat store & AI service reachability)
│   │           ├── auth.py            # POST /register, /login, /refresh | GET /me
│   │           ├── users.py           # GET & PUT /api/v1/users/me/profile
│   │           ├── nutrition.py       # POST /calculate-bmr, /analyze-photo, /calculate-exchanges | GET /meal-plan
│   │           └── chat.py            # POST /message | GET & DELETE /history
│   ├── models/                        # 🗄️ DATABASE LAYER (SQLAlchemy 2.0 + Beanie ODM)
│   │   ├── database.py                # PostgreSQL engine/session + MongoDB Motor/Beanie init
│   │   ├── user.py                    # PostgreSQL: `users` & `user_profiles`
│   │   ├── nutrition.py               # PostgreSQL: `meal_logs` & `meal_food_items`
│   │   └── chat_log.py                # MongoDB: `chat_logs` (conversation history & safety telemetry)
│   ├── schemas/                       # 📦 API CONTRACTS (Pydantic v2 BaseModel)
│   │   ├── auth.py                    # RegisterRequest, LoginRequest, RefreshRequest, TokenResponse
│   │   ├── user.py                    # ProfileUpdateRequest, ProfileRead
│   │   ├── nutrition.py               # BMR, Photo Recognition & MealPlan schemas
│   │   └── chat.py                    # ChatRequest, ChatResponse, UserDietContext, ChatHistoryResponse
│   └── services/                      # 🧠 BUSINESS LOGIC & AI ORCHESTRATION
│       ├── calculations.py            # BMI, Smart BMR Switch (Harris-Benedict / Mifflin), TDEE, Exchanges
│       ├── profile_service.py         # Upserts onboarding answers + clinical metrics into PostgreSQL
│       ├── guardrails.py              # Turkish accent-insensitive medical block & sensitive-topic detector
│       ├── chat_history.py            # Loads/saves last chat turns in MongoDB (with automatic in-memory fallback)
│       ├── prompt_builder.py          # Combines DB profile + mobile live context + last chats into AI payload
│       ├── ai_client.py               # Async HTTPX client calling the Local AI Service (:8001)
│       └── meal_plan.py               # 7-day meal plan generator scaled to user's target_calories
└── tests/
    ├── test_calculations.py           # Unit tests for clinical BMR/TDEE/BMI math
    └── test_api_flows.py              # End-to-end tests: Auth, Onboarding, Chat->AI memory, Guardrails, Photo CV
```

---

## 🔄 3. How the Chat Middleware Works (Step-by-Step)

When the user sends a message in the Mobile App (`POST /api/v1/chat/message`), the backend executes this pipeline:

```mermaid
sequenceDiagram
    autonumber
    participant Mobile as 📱 Mobile App
    participant Backend as ⚙️ FastAPI Backend
    participant PG as 🐘 PostgreSQL
    participant Mongo as 🍃 MongoDB (chat_logs)
    participant AI as 🤖 Local AI Service (:8001)

    Mobile->>Backend: POST /api/v1/chat/message<br/>{ message, user_context, session_id? }<br/>+ Optional Authorization: Bearer <token>
    Backend->>PG: If Bearer token present -> load User + UserProfile
    Backend->>Backend: Run guardrails.evaluate_message(message)
    alt Hard Medical Block (diagnosis, prescription, drug dose)
        Backend->>Mongo: Save blocked turn (safety_flag_triggered=true, model="guardrail")
        Backend-->>Mobile: Return refusal warning immediately (AI service NOT called)
    else Safe or Sensitive Health Topic
        Backend->>Mongo: Fetch last 10 turns for (user_id, session_id)
        Backend->>Backend: prompt_builder builds:<br/>1. Turkish System Prompt (with DB Profile + Mobile today context)<br/>2. messages[] = [last 10 turns..., current user message]
        Backend->>AI: POST /api/v1/llm/chat (system_prompt + messages[])
        AI-->>Backend: { text, model, safety_flag?, suggested_meal? }
        Backend->>Mongo: Save new turn (user_message + assistant_response)
        Backend-->>Mobile: ChatResponse { id, content, session_id, safety_flag_triggered, ... }
    end
```

### Why MongoDB (Not Redis) for Last Chats?
Our `docker-compose.yml` and `app/models/chat_log.py` use **MongoDB 7.0 (`chat_logs` collection)** with compound indexes on `(user_id, created_at DESC)` and `(session_id, created_at ASC)`:
1. **Persistent Conversation Memory:** Unlike a volatile cache, MongoDB keeps the user's last chats across container restarts AND stores the medical guardrail audit trail required for our graduation thesis evaluation.
2. **Zero-Config Dev Fallback:** If a teammate runs the backend without Docker/MongoDB running, `app/services/chat_history.py` automatically falls back to `InMemoryChatHistoryStore` so local testing still works out-of-the-box. You can check which one is active via `GET /api/v1/health` (`"chat_store": "mongodb"` vs `"memory"`).

---

## 🤖 4. Guide for the AI Service Developer (Local LLM & CV Contracts)

The backend communicates with the AI service over HTTP (`AI_SERVICE_URL=http://localhost:8001` locally, or `http://ai-service:8001` in Docker).

> **Key Design Rule for AI Service:**
> **You do NOT need to connect to PostgreSQL or MongoDB in `ai-service`!**
> The backend already fetches the user's clinical profile from PostgreSQL, merges it with today's live macros from the Mobile App, loads the last 10 chat turns from MongoDB, and sends you a ready-to-use `system_prompt` and `messages` list. Your service stays **100% stateless**: just run the local model (Ollama / vLLM / llama.cpp / HuggingFace / Vision model) and return JSON.

### Quick Checklist for Updating `ai-service/server.py`
1. **`GET /health`:** Keep returning HTTP `200` (`{"status": "ok", "service": "ai-service"}`). Backend checks this in `GET /api/v1/health` (`"ai_service_reachable": true`).
2. **`POST /api/v1/llm/chat`:** Extend `ChatbotRequest` to accept `system_prompt: Optional[str]`, `messages: Optional[List[Dict[str, str]]]`, `options: Optional[Dict[str, Any]]`, and `safety: Optional[Dict[str, Any]]` (alongside existing `prompt` and `user_context`), then pass `[{"role": "system", "content": system_prompt}, *messages]` to the local LLM and return `{"text": ..., "model": ..., "safety_flag": false, "suggested_meal": null}`.
3. **`POST /api/v1/cv/detect`:** Accept `image_base64` (already cleaned of any `data:image/...;base64,` prefix) and optional `meal_type` / `request_id`, run the food vision/portion model, and return `{"detected_items": [...]}`.
4. **Timeout & Fallback:** Backend waits up to `AI_SERVICE_TIMEOUT_SECONDS=60` seconds (configurable in `backend/.env`) so CPU/local GPU inference won't time out prematurely. Set `AI_MOCK_FALLBACK=false` in `backend/.env` when testing real AI errors strictly (`HTTP 503` instead of offline fallback).

---

### A. Chat Endpoint Contract: `POST /api/v1/llm/chat`

#### 1. What Backend Sends to AI Service (Request JSON):
```json
{
  "request_id": "9f8c2b1e4a7d4e5f8a1b2c3d4e5f6a7b",
  "session_id": "4b9e6c1a2d3f4a5b8c9d0e1f2a3b4c5d",
  "user_id": 1,
  "system_prompt": "Sen \"DietAI\" adında, bilimsel ve sağlıklı beslenme rehberliği sunan bir yapay zekâ beslenme asistanısın...\n\nKULLANICI PROFİLİ (veritabanından):\n- İsim: Bertan\n- Cinsiyet: Erkek\n- Yaş: 22\n- Boy: 180 cm, Kilo: 76 kg\n- BKİ (BMI): 23.5\n- İdeal kilo: 68 kg\n- Hedef: Kilo verme\n- Aktivite: Orta hareketli (haftada 3 gün spor)\n- BMR: 1869.2 kcal, TDEE: 2897.3 kcal\n- Günlük hedef: 2497.3 kcal | Protein 187.3 g, Karbonhidrat 249.7 g, Yağ 83.2 g\n\nBUGÜNKÜ DURUM (mobil uygulamadan, anlık):\n- Kalori (tüketilen / hedef): 1400 / 2292 kcal\n- Kalan kalori: 892 kcal\n- Protein: 95 / 172 g\n- Karbonhidrat: 130 / 229 g\n- Yağ: 45 / 76 g\n- Su: 1500 / 2500 ml\n- Bugün yenenler: Yulaflı Omlet, Izgara Tavuk",
  "messages": [
    { "role": "user", "content": "Akşam ne yemeliyim?" },
    { "role": "assistant", "content": "Kalan 892 kcal bütçeniz için ızgara somon ve buharda brokoli harika bir seçim olur." },
    { "role": "user", "content": "Peki yanına çorba olur mu?" }
  ],
  "prompt": "Peki yanına çorba olur mu?",
  "user_context": {
    "profile": { "...raw PostgreSQL profile dict (or null for guest)..." },
    "diet_today": { "...raw mobile UserDietContext dict (or null)..." }
  },
  "safety": {
    "sensitive_topic": false,
    "matched_keywords": []
  },
  "options": {
    "temperature": 0.4,
    "max_tokens": 512,
    "language": "tr"
  }
}
```

#### How to Use These Fields in `ai-service`:
| Field | Description |
| :--- | :--- |
| **`system_prompt`** (`str`) | **Ready-to-use system instruction.** Already includes ethical rules, calorie floor (`1200` / `1500` kcal), the user's PostgreSQL profile, today's consumed/remaining macros, and any extra warning if the topic is medically sensitive. |
| **`messages`** (`list[{role, content}]`) | **Full conversation window** in standard OpenAI / Ollama chat format: previous `user` and `assistant` turns from MongoDB (oldest $\rightarrow$ newest) followed by the current `user` message as the last element. |
| **`prompt`** (`str`) | Just the latest user message (kept for backward compatibility with the existing `server.py`). |
| **`user_context`** (`dict`) | Raw structured `profile` + `diet_today` dictionaries in case your code wants to inspect numbers directly. |
| **`options`** (`dict`) | Recommended generation parameters (`temperature`, `max_tokens`, `language`). |

#### Minimal Example for `ai-service` (Ollama / OpenAI-compatible Local LLM):
```python
# Inside ai-service POST /api/v1/llm/chat
chat_messages = [{"role": "system", "content": payload.system_prompt}, *payload.messages]
# Pass `chat_messages` directly to Ollama / vLLM / llama-cpp / HuggingFace pipeline!
```

#### 2. What AI Service Must Return to Backend (Response JSON):
```json
{
  "text": "Evet! 1 kase mercimek çorbası (~180 kcal, 11g protein) ekleyebilirsiniz; böylece akşam öğününüz kalan 892 kcal bütçenize tam uyar.",
  "model": "qwen2.5-7b-instruct-q4",
  "safety_flag": false,
  "suggested_meal": {
    "name": "Mercimek Çorbası & Izgara Somon",
    "portionGrams": 350,
    "mealType": "dinner",
    "calories": 520,
    "proteinGrams": 42,
    "carbsGrams": 34,
    "fatGrams": 22
  }
}
```
* **`text`** *(required, `str`)*: The assistant's reply (backend also accepts `content` or `response` keys).
* **`model`** *(optional, `str`)*: Name of the local model used (saved to MongoDB for thesis metrics).
* **`safety_flag`** *(optional, `bool`)*: Set `true` if your own AI guardrail flagged the prompt.
* **`suggested_meal`** *(optional, `object`)*: If returned, the Mobile App displays an interactive **"Add to Today's Meals"** card right inside the chat bubble!

---

### B. Food Vision Endpoint Contract: `POST /api/v1/cv/detect`

#### 1. What Backend Sends to AI Service:
```json
{
  "image_base64": "<clean base64 string without data:image/... prefix>",
  "meal_type": "lunch",
  "request_id": "9f8c2b1e4a7d4e5f8a1b2c3d4e5f6a7b"
}
```

#### 2. What AI Service Must Return to Backend:
```json
{
  "detected_items": [
    {
      "food_name": "Izgara Tavuk Göğsü",
      "estimated_grams": 180,
      "confidence": 0.94,
      "calories": 297,
      "protein": 55.8,
      "carbs": 0.0,
      "fat": 6.5,
      "fiber": 0.0,
      "allergens": []
    }
  ]
}
```
> The backend automatically converts `detected_items` (`snake_case`) into the Mobile App's `RecognitionResponse` (`camelCase`: `detectedFoods`, `totalNutrition`, `disclaimer`) and recomputes the macro totals so they always sum up accurately.

---

## 📱 5. Guide for the Mobile / Frontend Developer

All endpoints live under `/api/v1` (Interactive Swagger UI: `http://localhost:8000/api/v1/docs`).
Every response includes `X-Request-ID` and `X-Process-Time-Ms` headers.

### Summary of All Endpoints

| Method & Path | Auth | Description |
| :--- | :---: | :--- |
| `GET /api/v1/health` | Public | Returns backend status, active `chat_store` (`mongodb`/`memory`), and `ai_service_reachable` (`bool`). |
| `POST /api/v1/auth/register` | Public | Creates user (`is_onboarded=false`) and returns `access_token`, `refresh_token`, and `user`. |
| `POST /api/v1/auth/login` | Public | Login with `username_or_email` + `password`; returns `access_token`, `refresh_token`, and `user`. |
| `POST /api/v1/auth/refresh` | Public | Takes `{"refresh_token": "..."}` and rotates tokens (**matches `tryRefreshSession()` in `mobile/src/services/api.ts`!**). |
| `GET /api/v1/auth/me` | **Bearer** | Returns current logged-in user (`id`, `username`, `email`, `is_onboarded`). |
| `GET /api/v1/users/me/profile` | **Bearer** | Returns the user's saved onboarding profile & clinical targets (`404` if not onboarded yet). |
| `PUT /api/v1/users/me/profile` | **Bearer** | Saves/updates onboarding answers, computes BMI/BMR/TDEE/macros, and sets `is_onboarded = true`. |
| `POST /api/v1/nutrition/calculate-bmr` | Optional Bearer | Calculates BMI, Smart BMR (Harris-Benedict $\le 30$ BMI / Mifflin-St Jeor $> 30$ BMI), TDEE, Ideal Weight & macros. **If a Bearer token is attached, it ALSO saves the profile to PostgreSQL automatically!** |
| `POST /api/v1/nutrition/analyze-photo` | Optional Bearer | Validates Base64 image, calls AI Service `/api/v1/cv/detect`, and returns `RecognitionResponse`. |
| `GET /api/v1/nutrition/meal-plan` | Optional Bearer | Returns 7-day `MealPlanDay[]` scaled to the user's `target_calories` (**matches `apiService.getMealPlan()`**). |
| `POST /api/v1/nutrition/calculate-exchanges` | Public | Calculates total kcal/macros from Turkish clinical dietitian exchange counts (`milk`, `bread`, `meat`, etc.). |
| `POST /api/v1/chat/message` | Optional Bearer | Guardrailed chat endpoint with MongoDB conversation memory and Local AI integration. |
| `GET /api/v1/chat/history` | Optional Bearer | Returns recent messages (`user` & `assistant` bubbles) for a `session_id` (or latest user session). |
| `DELETE /api/v1/chat/history` | Optional Bearer | Clears MongoDB chat history (powers the **"🗑️ Sıfırla"** button in `ChatScreen.tsx`). |

---

### Key Frontend Flows

#### 1. Authentication & Automatic Token Refresh
`mobile/src/services/api.ts` already attaches `Authorization: Bearer <access_token>` from `expo-secure-store` and calls `POST /api/v1/auth/refresh` on `401`.
* **Register (`POST /api/v1/auth/register`):**
  ```json
  { "username": "bertan", "email": "bertan@example.com", "password": "strongpassword123" }
  ```
* **Login (`POST /api/v1/auth/login`):**
  ```json
  { "username_or_email": "bertan@example.com", "password": "strongpassword123" }
  ```
* **Response (`TokenResponse`):**
  ```json
  {
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "username": "bertan",
      "email": "bertan@example.com",
      "is_active": true,
      "is_onboarded": false,
      "created_at": "2026-11-17T17:00:00Z"
    }
  }
  ```
  Pass `access_token` and `refresh_token` to `apiService.setSessionTokens(access_token, refresh_token)`.

#### 2. Onboarding & Clinical BMR Calculation (`POST /api/v1/nutrition/calculate-bmr`)
`OnboardingScreen.tsx` already sends:
```json
{
  "weight_kg": 76.0,
  "height_cm": 180.0,
  "age": 22,
  "gender": "male",
  "does_sports": true,
  "sports_days_per_week": 3,
  "goal": "weight_loss",
  "calculation_basis": "current",
  "has_diabetes": false,
  "has_cholesterol": false,
  "has_hypertension": false
}
```
* **Guest user (no token):** Returns the full `BMRCalculationResponse` (`bmi`, `bmr`, `bmr_formula_used`, `tdee`, `ideal_weight_kg`, `target_calories`, `recommended_protein_g`, `recommended_carbs_g`, `recommended_fat_g`).
* **Logged-in user (`Authorization: Bearer <token>`):** Returns the exact same response **AND** saves the profile in PostgreSQL (`user_profiles`) + flips `user.is_onboarded = true`.

#### 3. Chat with Memory (`POST /api/v1/chat/message`)
`ChatScreen.tsx` sends `{ message, user_context }`.
* **Logged-in user:** Even if the mobile app does not pass `session_id`, the backend automatically looks up the user's latest `session_id` in MongoDB so multi-turn memory works immediately!
* **Guest user (no token):** The backend returns `session_id` in `ChatResponse`. Send that `session_id` back in the next `POST /api/v1/chat/message` body to keep conversation memory as a guest.
* **Resetting chat:** When the user taps **"🗑️ Sıfırla"**, call `DELETE /api/v1/chat/history` (with Bearer token or `?session_id=...`) so the backend also starts a fresh memory window.

---

## ⚙️ 6. Key Environment Variables (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` for local overrides:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:postgrespassword@localhost:5432/diet_ai_db` | PostgreSQL connection string (`users`, `user_profiles`, `meal_logs`). |
| `MONGODB_URL` / `MONGODB_DB_NAME` | `mongodb://localhost:27017` / `diet_ai_nosql` | MongoDB connection for `chat_logs` (auto-falls back to in-memory if unreachable). |
| `CHAT_HISTORY_LIMIT` | `10` | Number of previous chat turns loaded from MongoDB and sent to the AI service. |
| `AI_SERVICE_URL` | `http://localhost:8001` | Base URL of `/ai-service` (`http://ai-service:8001` inside Docker). |
| `AI_SERVICE_TIMEOUT_SECONDS` | `60` | HTTP timeout for local LLM / CV inference. |
| `AI_MOCK_FALLBACK` | `true` | `true`: return offline demo reply/detection when AI service is down; `false`: return `HTTP 503`. |
| `AI_TEMPERATURE` / `AI_MAX_TOKENS` | `0.4` / `512` | Default generation options forwarded to `POST /api/v1/llm/chat`. |
| `SECRET_KEY` | dev default | Signing key for JWT access (`60m`) and refresh (`30d`) tokens. |

---

## 🧪 7. Running Backend, Tests & End-to-End Verification Locally

```bash
cd backend

# 1. Create virtual environment & install dependencies
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate
pip install -r requirements.txt

# 2. Run the full automated test suite (12 tests: clinical math + auth + onboarding + chat memory + AI contracts)
python -m pytest -v

# 3. Start the FastAPI server (works even if Docker/Mongo/AI-service are off!)
uvicorn app.main:app --reload --port 8000

# 4. Verify live health & AI Service connectivity
# Open http://localhost:8000/api/v1/health
# Expect: "chat_store": "mongodb" (with Docker) and "ai_service_reachable": true (when ai-service :8001 is up)

# 5. Open Interactive Swagger UI Docs
# http://localhost:8000/api/v1/docs
```

### Connecting Mobile App to Your Local Backend
In `mobile/.env`:
```env
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LOCAL_LAN_IP>:8000/api/v1
EXPO_PUBLIC_USE_MOCK_DATA=false
```
Then run `npx expo start` inside `/mobile`.
