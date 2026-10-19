from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "DietAI Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "temporary-dev-secret-key-change-in-production"

    # Relational Database (PostgreSQL) — Users, Profiles, Meal Logs
    DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/diet_ai_db"

    # NoSQL Database (MongoDB) — Chat Logs & Guardrail Telemetry
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "diet_ai_nosql"

    AI_SERVICE_URL: str = "http://localhost:8001"
    CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

