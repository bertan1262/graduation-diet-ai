from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid
from beanie import Document, Indexed
from pydantic import Field
from pymongo import ASCENDING, DESCENDING, IndexModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ChatLogDocument(Document):
    """
    MongoDB NoSQL Document model for storing AI Dietician chat interactions,
    flexible user nutritional context snapshots, and ethical guardrail audit flags.
    """
    # Logical link to PostgreSQL users.id (Optional for anonymous/guest sessions)
    user_id: Optional[Indexed(int)] = None

    # Groups messages belonging to the same conversation thread
    session_id: Indexed(str) = Field(default_factory=lambda: str(uuid.uuid4()))

    # Prompt & AI Response
    user_message: str = Field(..., min_length=1)
    assistant_response: str = Field(...)

    # Ethical & Medical Guardrail Audit Telemetry
    safety_flag_triggered: bool = Field(default=False)
    triggered_keywords: List[str] = Field(default_factory=list)

    # Flexible NoSQL JSON snapshot of the user's diet state at the time of chat
    # (e.g. {"target_calories": 2100, "consumed_today": 1450, "goal": "weight_loss"})
    user_context_snapshot: Optional[Dict[str, Any]] = None

    # Performance & Model metadata
    model_name: str = Field(default="gemini-2.5-flash")
    latency_ms: Optional[float] = None
    created_at: datetime = Field(default_factory=utc_now)

    class Settings:
        name = "chat_logs"
        indexes = [
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("session_id", ASCENDING), ("created_at", ASCENDING)]),
            IndexModel([("safety_flag_triggered", ASCENDING)]),
        ]
