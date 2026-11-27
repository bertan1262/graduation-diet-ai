"""
HTTP client for the local AI service (/ai-service).

    request_chat_completion(payload)  -> POST {AI_SERVICE_URL}{AI_CHAT_PATH}
    request_food_detection(payload)   -> POST {AI_SERVICE_URL}{AI_DETECT_PATH}
    check_ai_service_health()         -> GET  {AI_SERVICE_URL}/health

Any network error, timeout, non-2xx status or malformed JSON raises AIServiceError,
so endpoints only need to handle a single exception type.
"""

import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("dietai.ai_client")


class AIServiceError(Exception):
    """The AI service is unreachable or returned an unusable response."""


@dataclass
class ChatCompletion:
    text: str
    model: str
    safety_flag: bool = False
    suggested_meal: Optional[Dict[str, Any]] = None


async def _post_json(path: str, payload: Dict[str, Any], request_id: str = "") -> Dict[str, Any]:
    headers = {"X-Request-ID": request_id} if request_id else {}
    try:
        async with httpx.AsyncClient(
            base_url=settings.AI_SERVICE_URL,
            timeout=settings.AI_SERVICE_TIMEOUT_SECONDS,
        ) as client:
            response = await client.post(path, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException as exc:
        raise AIServiceError(f"AI service timed out after {settings.AI_SERVICE_TIMEOUT_SECONDS}s") from exc
    except httpx.HTTPStatusError as exc:
        raise AIServiceError(f"AI service returned HTTP {exc.response.status_code}") from exc
    except httpx.HTTPError as exc:
        raise AIServiceError(f"AI service unreachable: {exc.__class__.__name__}") from exc
    except ValueError as exc:  # invalid JSON
        raise AIServiceError("AI service returned invalid JSON") from exc

    if not isinstance(data, dict):
        raise AIServiceError("AI service response must be a JSON object")
    return data


async def request_chat_completion(payload: Dict[str, Any]) -> ChatCompletion:
    data = await _post_json(settings.AI_CHAT_PATH, payload, request_id=str(payload.get("request_id", "")))

    # Accept a few common key names so the AI service can stay simple.
    text = data.get("text") or data.get("content") or data.get("response")
    if not isinstance(text, str) or not text.strip():
        raise AIServiceError("AI service response is missing a non-empty 'text' field")

    suggested = data.get("suggested_meal") or data.get("suggestedMeal")
    return ChatCompletion(
        text=text.strip(),
        model=str(data.get("model") or "local-llm"),
        safety_flag=bool(data.get("safety_flag", False)),
        suggested_meal=suggested if isinstance(suggested, dict) else None,
    )


async def request_food_detection(payload: Dict[str, Any], request_id: str = "") -> Dict[str, Any]:
    data = await _post_json(settings.AI_DETECT_PATH, payload, request_id=request_id)
    if not isinstance(data.get("detected_items"), list):
        raise AIServiceError("AI service response is missing the 'detected_items' list")
    return data


async def check_ai_service_health() -> bool:
    try:
        async with httpx.AsyncClient(base_url=settings.AI_SERVICE_URL, timeout=2.0) as client:
            response = await client.get("/health")
            return response.status_code == 200
    except httpx.HTTPError:
        return False
