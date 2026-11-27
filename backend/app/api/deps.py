"""
FastAPI dependencies = the "auth middleware" of the API.

How to use in an endpoint:

    user: User = Depends(get_current_user)            # login REQUIRED  (401 if missing)
    user: Optional[User] = Depends(get_optional_user) # login OPTIONAL  (guest -> None)

Rules (same for both):
    * No `Authorization` header                -> required: 401 | optional: None (guest)
    * Invalid / expired access token           -> 401  (mobile app then calls /auth/refresh and retries)
    * Valid token but user deleted/deactivated -> 401 / 403
"""

from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.models.database import get_db
from app.models.user import User, UserProfile

bearer_scheme = HTTPBearer(auto_error=False, description="Paste the `access_token` from /auth/login")


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _resolve_user(credentials: HTTPAuthorizationCredentials, db: Session) -> User:
    user_id = decode_token(credentials.credentials, expected_type="access")
    if user_id is None:
        raise _unauthorized("Invalid or expired access token")

    user = db.get(User, user_id)
    if user is None:
        raise _unauthorized("User no longer exists")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled")
    return user


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise _unauthorized("Not authenticated")
    return _resolve_user(credentials, db)


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if credentials is None:
        return None
    return _resolve_user(credentials, db)


# ----------------------------------------------------------------------
# Plain-data snapshot of the logged-in user (used by the async chat flow so
# that no lazy SQL queries happen inside the event loop).
# ----------------------------------------------------------------------

PROFILE_CONTEXT_FIELDS = (
    "full_name",
    "age",
    "gender",
    "height_cm",
    "weight_kg",
    "bmi",
    "goal",
    "activity_level",
    "does_sports",
    "sports_days_per_week",
    "bmr",
    "tdee",
    "ideal_weight_kg",
    "target_calories",
    "recommended_protein_g",
    "recommended_carbs_g",
    "recommended_fat_g",
    "has_diabetes",
    "has_cholesterol",
    "has_hypertension",
)


@dataclass
class UserSnapshot:
    user_id: int
    username: str
    is_onboarded: bool
    profile: Optional[Dict[str, Any]] = field(default=None)


def profile_to_context(profile: Optional[UserProfile]) -> Optional[Dict[str, Any]]:
    if profile is None:
        return None
    return {name: getattr(profile, name) for name in PROFILE_CONTEXT_FIELDS}


def get_optional_user_snapshot(
    user: Optional[User] = Depends(get_optional_user),
) -> Optional[UserSnapshot]:
    if user is None:
        return None
    return UserSnapshot(
        user_id=user.id,
        username=user.username,
        is_onboarded=user.is_onboarded,
        profile=profile_to_context(user.profile),
    )
