"""
Password hashing and JWT helpers.

- Passwords are hashed with bcrypt (we use the `bcrypt` package directly instead
  of passlib, because passlib 1.7.4 is incompatible with bcrypt >= 4.1).
- Two token types are issued:
    * access  token: short-lived, sent as `Authorization: Bearer <token>`
    * refresh token: long-lived, only accepted by `POST /api/v1/auth/refresh`
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

TokenType = Literal["access", "refresh"]

# bcrypt only looks at the first 72 bytes of a password. We reject longer
# passwords at the schema level so nothing is silently truncated.
BCRYPT_MAX_PASSWORD_BYTES = 72


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_token(user_id: int, token_type: TokenType) -> str:
    now = datetime.now(timezone.utc)
    if token_type == "access":
        expires_at = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    else:
        expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": str(user_id),
        "type": token_type,
        "iat": now,
        "exp": expires_at,
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str, expected_type: TokenType) -> Optional[int]:
    """Returns the user id stored in the token, or None if the token is invalid/expired/wrong type."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None

    if payload.get("type") != expected_type:
        return None

    subject = payload.get("sub")
    try:
        return int(subject)
    except (TypeError, ValueError):
        return None
