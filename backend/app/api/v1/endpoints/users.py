from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.models.database import get_db
from app.models.user import User
from app.schemas.user import ProfileRead, ProfileUpdateRequest
from app.services.profile_service import upsert_profile

router = APIRouter(tags=["Users"])


@router.get("/me/profile", response_model=ProfileRead)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Returns the saved onboarding profile + clinical targets. 404 if onboarding is not done yet."""
    if current_user.profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Complete onboarding first (PUT /users/me/profile).",
        )
    return current_user.profile


@router.put("/me/profile", response_model=ProfileRead)
def update_my_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Saves the onboarding answers (same JSON as /nutrition/calculate-bmr + optional full_name),
    recalculates BMI/BMR/TDEE/targets and sets `is_onboarded = true`.
    Use it for first onboarding AND for later profile edits (e.g. new weight).
    """
    return upsert_profile(db, current_user, payload, full_name=payload.full_name)
