from datetime import datetime, timezone

from fastapi import APIRouter

from app.services.ai_client import check_ai_service_health
from app.services.chat_history import get_chat_store

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check():
    chat_store = get_chat_store()
    ai_ok = await check_ai_service_health()
    return {
        "status": "online",
        "service": "DietAI Backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "chat_store": chat_store.backend_name,  # "mongodb" or "memory"
        "ai_service_reachable": ai_ok,
    }
