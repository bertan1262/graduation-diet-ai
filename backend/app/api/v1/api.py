from fastapi import APIRouter
from app.api.v1.endpoints import health, nutrition, chat

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(nutrition.router, prefix="/nutrition")
api_router.include_router(chat.router, prefix="/chat")
