from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "DietAI Backend"
    API_V1_STR: str = "/api/v1"
    LOG_LEVEL: str = "INFO"

    # ------------------------------------------------------------------
    # Security / JWT (used by /auth endpoints and the Bearer middleware)
    # ------------------------------------------------------------------
    SECRET_KEY: str = "temporary-dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Relational Database (PostgreSQL) — Users, Profiles, Meal Logs
    DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/diet_ai_db"

    # NoSQL Database (MongoDB) — Chat Logs & Guardrail Telemetry
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "diet_ai_nosql"

    # ------------------------------------------------------------------
    # Local AI Service (/ai-service) — the backend builds the prompt and
    # context, the AI service only runs the model.
    # ------------------------------------------------------------------
    AI_SERVICE_URL: str = "http://localhost:8001"
    AI_CHAT_PATH: str = "/api/v1/llm/chat"
    AI_DETECT_PATH: str = "/api/v1/cv/detect"
    # Local LLMs can be slow on CPU, so this is intentionally generous.
    AI_SERVICE_TIMEOUT_SECONDS: float = 60.0
    # When the AI service is down: True -> return a clearly-labelled offline
    # reply / demo detection (good for development), False -> HTTP 503.
    AI_MOCK_FALLBACK: bool = True
    AI_TEMPERATURE: float = 0.4
    AI_MAX_TOKENS: int = 512

    # How many previous chat turns (user message + assistant reply pairs)
    # are loaded from MongoDB and sent to the AI service as memory.
    CHAT_HISTORY_LIMIT: int = 10

    CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
