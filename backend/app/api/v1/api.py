from fastapi import APIRouter

from app.api.v1.endpoints import auth, chat, health, nutrition, users

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(users.router, prefix="/users")
api_router.include_router(nutrition.router, prefix="/nutrition")
api_router.include_router(chat.router, prefix="/chat")
