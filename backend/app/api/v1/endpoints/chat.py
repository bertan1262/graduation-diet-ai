import logging
import time
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import ValidationError

from app.api.deps import UserSnapshot, get_optional_user_snapshot
from app.core.config import settings
from app.core.middleware import get_request_id
from app.schemas.chat import (
    SESSION_ID_PATTERN,
    ChatDeleteResponse,
    ChatHistoryMessage,
    ChatHistoryResponse,
    ChatRequest,
    ChatResponse,
    SuggestedMeal,
    UserDietContext,
)
from app.services import ai_client
from app.services.chat_history import (
    ChatHistoryStore,
    ChatTurn,
    NewChatTurn,
    get_chat_store,
    new_session_id,
)
from app.services.guardrails import MEDICAL_REFUSAL_MESSAGE, evaluate_message
from app.services.prompt_builder import build_chat_payload

logger = logging.getLogger("dietai.chat")

router = APIRouter(tags=["Chat"])


def _offline_fallback_reply(message: str, diet: Optional[UserDietContext], profile: Optional[dict]) -> str:
    """Used only when the local AI service is unreachable and AI_MOCK_FALLBACK=true."""
    target = (
        (diet.targetCalories if diet and diet.targetCalories is not None else None)
        or (profile.get("target_calories") if profile else None)
        or 2000
    )
    remaining = diet.remainingCalories if diet and diet.remainingCalories is not None else None
    budget_note = (
        f"Günlük {int(round(target))} kcal hedefinizde kalan {int(round(remaining))} kcal "
        if remaining is not None
        else f"Günlük {int(round(target))} kcal hedefiniz "
    )
    return (
        f"{budget_note}doğrultusunda '{message}' için porsiyon kontrolüne dikkat etmeniz, "
        "tabağınızda lif ve protein dengesini korumanız ve yeterli su tüketmeniz önerilir. "
        "(Not: Yerel AI servisine şu anda ulaşılamadığı için çevrimdışı yedek yanıt gösteriliyor.)"
    )


async def _resolve_session_id(
    requested_session_id: Optional[str],
    user: Optional[UserSnapshot],
    store: ChatHistoryStore,
) -> str:
    """
    1. If the client sent a `session_id`, use it.
    2. Otherwise, if the user is logged in, reuse their latest session in MongoDB
       (so the current mobile app — which doesn't send `session_id` yet — still
       gets conversation memory automatically once logged in).
    3. Otherwise, start a new session.
    """
    if requested_session_id:
        return requested_session_id
    if user is not None:
        latest = await store.get_latest_session_id(user.user_id)
        if latest:
            return latest
    return new_session_id()


def _parse_suggested_meal(raw: Optional[dict]) -> Optional[SuggestedMeal]:
    if not raw:
        return None
    try:
        return SuggestedMeal.model_validate(raw)
    except ValidationError:
        logger.warning("Ignoring invalid suggested_meal from AI service: %s", raw)
        return None


@router.post("/message", response_model=ChatResponse)
async def send_chat_message(
    payload: ChatRequest,
    request: Request,
    user: Optional[UserSnapshot] = Depends(get_optional_user_snapshot),
    store: ChatHistoryStore = Depends(get_chat_store),
):
    """
    Main chat middleware between the Mobile App and the Local AI Service.

    Steps:
      1. Guardrail check (blocks medical diagnosis/prescription requests immediately).
      2. Load the user's profile from PostgreSQL (if logged in) + today's live
         `user_context` sent by the mobile app.
      3. Load the last `CHAT_HISTORY_LIMIT` turns of this conversation from MongoDB.
      4. Build `system_prompt` + `messages` and POST them to the local AI service
         (`{AI_SERVICE_URL}/api/v1/llm/chat`).
      5. Save the new turn to MongoDB and return the reply to the mobile app.
    """
    started = time.perf_counter()
    request_id = get_request_id(request)
    user_id = user.user_id if user is not None else None
    profile = user.profile if user is not None else None
    diet_dict = payload.user_context.model_dump(exclude_none=True) if payload.user_context else None

    session_id = await _resolve_session_id(payload.session_id, user, store)
    verdict = evaluate_message(payload.message)

    # 1. Hard medical block -> do NOT call the AI service
    if verdict.blocked:
        saved = await store.save_turn(
            NewChatTurn(
                session_id=session_id,
                user_id=user_id,
                user_message=payload.message,
                assistant_response=MEDICAL_REFUSAL_MESSAGE,
                safety_flag_triggered=True,
                triggered_keywords=verdict.matched_keywords,
                user_context_snapshot=diet_dict,
                model_name="guardrail",
                latency_ms=round((time.perf_counter() - started) * 1000, 1),
            )
        )
        return ChatResponse(
            id=saved.id,
            content=MEDICAL_REFUSAL_MESSAGE,
            timestamp=saved.created_at.isoformat(),
            session_id=session_id,
            safety_flag_triggered=True,
            isMedicalWarning=True,
            model="guardrail",
            ai_available=True,
        )

    # 2. Load recent chat turns from MongoDB and build the AI service request
    history: List[ChatTurn] = await store.get_recent_turns(
        session_id=session_id,
        user_id=user_id,
        limit=settings.CHAT_HISTORY_LIMIT,
    )
    ai_payload = build_chat_payload(
        request_id=request_id,
        session_id=session_id,
        user_id=user_id,
        message=payload.message,
        history=history,
        profile=profile,
        diet_today=diet_dict,
        verdict=verdict,
    )

    # 3. Call the local AI service
    suggested_meal: Optional[SuggestedMeal] = None
    ai_available = True
    try:
        completion = await ai_client.request_chat_completion(ai_payload)
        reply_text = completion.text
        model_name = completion.model
        safety_flag = verdict.flagged or completion.safety_flag
        suggested_meal = _parse_suggested_meal(completion.suggested_meal)
    except ai_client.AIServiceError as exc:
        logger.warning("AI chat service failed [%s]: %s", request_id, exc)
        if not settings.AI_MOCK_FALLBACK:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is currently unavailable",
            )
        reply_text = _offline_fallback_reply(payload.message, payload.user_context, profile)
        model_name = "offline-fallback"
        safety_flag = verdict.flagged
        ai_available = False

    # 4. Save this turn to MongoDB so the next message remembers it
    saved = await store.save_turn(
        NewChatTurn(
            session_id=session_id,
            user_id=user_id,
            user_message=payload.message,
            assistant_response=reply_text,
            safety_flag_triggered=safety_flag,
            triggered_keywords=verdict.matched_keywords,
            user_context_snapshot=diet_dict,
            model_name=model_name,
            latency_ms=round((time.perf_counter() - started) * 1000, 1),
        )
    )

    return ChatResponse(
        id=saved.id,
        content=reply_text,
        timestamp=saved.created_at.isoformat(),
        session_id=session_id,
        safety_flag_triggered=safety_flag,
        isMedicalWarning=safety_flag,
        suggestedMeal=suggested_meal,
        model=model_name,
        ai_available=ai_available,
    )


@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    session_id: Optional[str] = Query(default=None, pattern=SESSION_ID_PATTERN),
    limit: int = Query(default=20, ge=1, le=100, description="Number of turns (user+assistant pairs) to return"),
    user: Optional[UserSnapshot] = Depends(get_optional_user_snapshot),
    store: ChatHistoryStore = Depends(get_chat_store),
):
    """
    Returns recent messages of a conversation (oldest -> newest).
    Guests must pass `session_id`; logged-in users default to their latest session.
    """
    user_id = user.user_id if user is not None else None
    resolved_session = session_id or (await store.get_latest_session_id(user_id) if user_id is not None else None)
    if not resolved_session:
        return ChatHistoryResponse(session_id=None, messages=[])

    turns = await store.get_recent_turns(session_id=resolved_session, user_id=user_id, limit=limit)
    messages: List[ChatHistoryMessage] = []
    for turn in turns:
        ts = turn.created_at.isoformat()
        messages.append(
            ChatHistoryMessage(id=f"{turn.id}-user", sender="user", content=turn.user_message, timestamp=ts)
        )
        messages.append(
            ChatHistoryMessage(
                id=turn.id,
                sender="assistant",
                content=turn.assistant_response,
                timestamp=ts,
                safety_flag_triggered=turn.safety_flag_triggered,
                isMedicalWarning=turn.safety_flag_triggered,
            )
        )
    return ChatHistoryResponse(session_id=resolved_session, messages=messages)


@router.delete("/history", response_model=ChatDeleteResponse)
async def clear_chat_history(
    session_id: Optional[str] = Query(default=None, pattern=SESSION_ID_PATTERN),
    user: Optional[UserSnapshot] = Depends(get_optional_user_snapshot),
    store: ChatHistoryStore = Depends(get_chat_store),
):
    """
    Deletes chat history in MongoDB (powers the mobile app's 'Sohbeti Sıfırla' button).
    - Logged-in user: deletes the given `session_id`, or ALL of their sessions if omitted.
    - Guest: `session_id` is required.
    """
    if user is None and session_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pass `session_id` (or log in) to clear chat history",
        )
    user_id = user.user_id if user is not None else None
    deleted = await store.delete_turns(user_id=user_id, session_id=session_id)
    return ChatDeleteResponse(deleted_turns=deleted)
