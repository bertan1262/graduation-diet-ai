from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "service": "DietAI Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
