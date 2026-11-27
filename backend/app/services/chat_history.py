"""
Chat memory store â€” where previous chat turns ("last chats") live.

Production: MongoDB (`chat_logs` collection, see app/models/chat_log.py).
Fallback:   in-memory store, used automatically ONLY if MongoDB is unreachable at
            startup (so the app still works on a laptop without Mongo). It is
            reported in GET /api/v1/health and a warning is logged. Data in the
            in-memory store is lost on restart.

One "turn" = one user message + the assistant reply to it.
"""

import asyncio
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Protocol

logger = logging.getLogger("dietai.chat_history")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def new_session_id() -> str:
    return uuid.uuid4().hex


@dataclass
class ChatTurn:
    id: str
    session_id: str
    user_id: Optional[int]
    user_message: str
    assistant_response: str
    safety_flag_triggered: bool = False
    triggered_keywords: List[str] = field(default_factory=list)
    model_name: str = "unknown"
    created_at: datetime = field(default_factory=utc_now)


@dataclass
class NewChatTurn:
    session_id: str
    user_id: Optional[int]
    user_message: str
    assistant_response: str
    safety_flag_triggered: bool = False
    triggered_keywords: List[str] = field(default_factory=list)
    user_context_snapshot: Optional[Dict[str, Any]] = None
    model_name: str = "unknown"
    latency_ms: Optional[float] = None


class ChatHistoryStore(Protocol):
    backend_name: str

    async def get_recent_turns(self, session_id: str, user_id: Optional[int], limit: int) -> List[ChatTurn]:
        """Newest `limit` turns of a session, returned oldest -> newest."""
        ...

    async def get_latest_session_id(self, user_id: int) -> Optional[str]:
        ...

    async def save_turn(self, turn: NewChatTurn) -> ChatTurn:
        ...

    async def delete_turns(self, user_id: Optional[int], session_id: Optional[str]) -> int:
        ...


# ----------------------------------------------------------------------
# In-memory implementation (dev fallback + tests)
# ----------------------------------------------------------------------


class InMemoryChatHistoryStore:
    backend_name = "memory"

    def __init__(self) -> None:
        self._turns: List[ChatTurn] = []
        self._lock = asyncio.Lock()

    async def get_recent_turns(self, session_id: str, user_id: Optional[int], limit: int) -> List[ChatTurn]:
        if limit <= 0:
            return []
        async with self._lock:
            matching = [t for t in self._turns if t.session_id == session_id and t.user_id == user_id]
        matching.sort(key=lambda t: t.created_at)
        return matching[-limit:]

    async def get_latest_session_id(self, user_id: int) -> Optional[str]:
        async with self._lock:
            mine = [t for t in self._turns if t.user_id == user_id]
        if not mine:
            return None
        return max(mine, key=lambda t: t.created_at).session_id

    async def save_turn(self, turn: NewChatTurn) -> ChatTurn:
        stored = ChatTurn(
            id=uuid.uuid4().hex,
            session_id=turn.session_id,
            user_id=turn.user_id,
            user_message=turn.user_message,
            assistant_response=turn.assistant_response,
            safety_flag_triggered=turn.safety_flag_triggered,
            triggered_keywords=list(turn.triggered_keywords),
            model_name=turn.model_name,
        )
        async with self._lock:
            self._turns.append(stored)
        return stored

    async def delete_turns(self, user_id: Optional[int], session_id: Optional[str]) -> int:
        def should_delete(t: ChatTurn) -> bool:
            if t.user_id != user_id:
                return False
            return session_id is None or t.session_id == session_id

        async with self._lock:
            before = len(self._turns)
            self._turns = [t for t in self._turns if not should_delete(t)]
            return before - len(self._turns)


# ----------------------------------------------------------------------
# MongoDB implementation (Beanie ODM)
# ----------------------------------------------------------------------


class MongoChatHistoryStore:
    backend_name = "mongodb"

    @staticmethod
    def _to_turn(doc: Any) -> ChatTurn:
        created_at = doc.created_at
        if created_at.tzinfo is None:  # MongoDB returns naive UTC datetimes
            created_at = created_at.replace(tzinfo=timezone.utc)
        return ChatTurn(
            id=str(doc.id),
            session_id=doc.session_id,
            user_id=doc.user_id,
            user_message=doc.user_message,
            assistant_response=doc.assistant_response,
            safety_flag_triggered=doc.safety_flag_triggered,
            triggered_keywords=list(doc.triggered_keywords or []),
            model_name=doc.model_name,
            created_at=created_at,
        )

    async def get_recent_turns(self, session_id: str, user_id: Optional[int], limit: int) -> List[ChatTurn]:
        from app.models.chat_log import ChatLogDocument

        if limit <= 0:
            return []
        docs = (
            await ChatLogDocument.find({"session_id": session_id, "user_id": user_id})
            .sort("-created_at")
            .limit(limit)
            .to_list()
        )
        return [self._to_turn(d) for d in reversed(docs)]

    async def get_latest_session_id(self, user_id: int) -> Optional[str]:
        from app.models.chat_log import ChatLogDocument

        docs = await ChatLogDocument.find({"user_id": user_id}).sort("-created_at").limit(1).to_list()
        return docs[0].session_id if docs else None

    async def save_turn(self, turn: NewChatTurn) -> ChatTurn:
        from app.models.chat_log import ChatLogDocument

        doc = ChatLogDocument(
            user_id=turn.user_id,
            session_id=turn.session_id,
            user_message=turn.user_message,
            assistant_response=turn.assistant_response,
            safety_flag_triggered=turn.safety_flag_triggered,
            triggered_keywords=list(turn.triggered_keywords),
            user_context_snapshot=turn.user_context_snapshot,
            model_name=turn.model_name,
            latency_ms=turn.latency_ms,
        )
        await doc.insert()
        return self._to_turn(doc)

    async def delete_turns(self, user_id: Optional[int], session_id: Optional[str]) -> int:
        from app.models.chat_log import ChatLogDocument

        query: Dict[str, Any] = {"user_id": user_id}
        if session_id is not None:
            query["session_id"] = session_id
        result = await ChatLogDocument.find(query).delete()
        return int(getattr(result, "deleted_count", 0) or 0)


# ----------------------------------------------------------------------
# Lifecycle (called from app/main.py lifespan)
# ----------------------------------------------------------------------

_store: ChatHistoryStore = InMemoryChatHistoryStore()


async def init_chat_store() -> None:
    global _store
    from app.models.database import init_nosql_db

    try:
        await init_nosql_db()
        _store = MongoChatHistoryStore()
        logger.info("Chat history store: MongoDB")
    except Exception as exc:  # pragma: no cover - depends on local infrastructure
        _store = InMemoryChatHistoryStore()
        logger.warning(
            "MongoDB unavailable (%s). Falling back to IN-MEMORY chat history (lost on restart).", exc
        )


async def close_chat_store() -> None:
    from app.models.database import close_nosql_db

    await close_nosql_db()


def get_chat_store() -> ChatHistoryStore:
    """FastAPI dependency (override it in tests)."""
    return _store
