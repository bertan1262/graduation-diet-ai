import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.middleware import RequestContextMiddleware, register_exception_handlers
from app.models.database import init_postgres_db
from app.services.chat_history import close_chat_store, get_chat_store, init_chat_store

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("dietai.startup")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_postgres_db()
        logger.info("PostgreSQL tables ready")
    except Exception as exc:  # pragma: no cover - depends on local infrastructure
        logger.warning("PostgreSQL not reachable at startup (%s). Will retry on first query.", exc)

    # Skip network MongoDB ping when tests already injected an in-memory chat store
    if get_chat_store not in app.dependency_overrides:
        await init_chat_store()
    yield
    await close_chat_store()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Graduation Project: AI-Powered Diet Management API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    lifespan=lifespan,
)

register_exception_handlers(app)
app.add_middleware(RequestContextMiddleware)

# CORS: if origins contains "*", credentials must be False (browser spec).
allow_all_origins = "*" in settings.CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time-Ms"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": "Welcome to DietAI API",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
