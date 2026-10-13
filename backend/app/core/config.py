from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DietAI Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "temporary-dev-secret-key-change-in-production"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/diet_ai_db"
    AI_SERVICE_URL: str = "http://localhost:8001"
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
