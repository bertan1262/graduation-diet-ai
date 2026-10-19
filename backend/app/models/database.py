from typing import Generator, Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from beanie import init_beanie
from app.core.config import settings


# =====================================================================
# 1. RELATIONAL DATABASE (PostgreSQL + SQLAlchemy 2.0)
#    Used for structured, ACID-compliant data: Users, Profiles, Meals
# =====================================================================

class Base(DeclarativeBase):
    """Base class for all SQLAlchemy 2.0 relational ORM models."""
    pass


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verifies connection health before checkout from pool
    echo=False,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a PostgreSQL database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Alias for backward compatibility
get_session = get_db


def init_postgres_db() -> None:
    """Creates all PostgreSQL tables registered on Base.metadata."""
    import app.models.user  # noqa: F401
    import app.models.nutrition  # noqa: F401

    Base.metadata.create_all(bind=engine)


# =====================================================================
# 2. NOSQL DOCUMENT DATABASE (MongoDB + Motor + Beanie ODM)
#    Used for unstructured/high-write Chat Logs & Guardrail Audit Logs
# =====================================================================

_mongo_client: Optional[AsyncIOMotorClient] = None


async def init_nosql_db() -> None:
    """Initializes the async MongoDB connection and Beanie document models."""
    global _mongo_client
    from app.models.chat_log import ChatLogDocument

    _mongo_client = AsyncIOMotorClient(settings.MONGODB_URL)
    database: AsyncIOMotorDatabase = _mongo_client[settings.MONGODB_DB_NAME]

    await init_beanie(
        database=database,
        document_models=[ChatLogDocument],
    )


async def close_nosql_db() -> None:
    """Cleanly closes the MongoDB client connection on application shutdown."""
    global _mongo_client
    if _mongo_client is not None:
        _mongo_client.close()
        _mongo_client = None


def get_nosql_db() -> AsyncIOMotorDatabase:
    """Returns the active MongoDB database instance."""
    if _mongo_client is None:
        raise RuntimeError("MongoDB client has not been initialized. Call init_nosql_db() first.")
    return _mongo_client[settings.MONGODB_DB_NAME]