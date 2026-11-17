"""Saving the onboarding questionnaire + calculated clinical metrics to PostgreSQL."""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User, UserProfile
from app.schemas.nutrition import BMRCalculationRequest
from app.services.calculations import calculate_full_anthropometrics


def calculate_metrics(req: BMRCalculationRequest) -> dict:
    return calculate_full_anthropometrics(
        weight_kg=req.weight_kg,
        height_cm=req.height_cm,
        age=req.age,
        gender=req.gender,
        activity_level=req.activity_level,
        activity_factor=req.activity_factor,
        does_sports=req.does_sports,
        sports_days_per_week=req.sports_days_per_week,
        goal=req.goal,
        calculation_basis=req.calculation_basis,
    )


def upsert_profile(
    db: Session,
    user: User,
    req: BMRCalculationRequest,
    metrics: Optional[dict] = None,
    full_name: Optional[str] = None,
) -> UserProfile:
    """
    Creates or updates the user's profile row and marks the user as onboarded.
    `metrics` can be passed if they were already calculated (avoids doing it twice).
    """
    metrics = metrics or calculate_metrics(req)

    if req.does_sports is not None:
        does_sports = req.does_sports
    else:
        does_sports = bool(req.sports_days_per_week)
    sports_days = (req.sports_days_per_week or 0) if does_sports else 0

    profile = user.profile
    if profile is None:
        profile = UserProfile()
        user.profile = profile  # cascade adds it to the session and sets user_id

    if full_name is not None:
        profile.full_name = full_name

    profile.weight_kg = req.weight_kg
    profile.height_cm = req.height_cm
    profile.age = req.age
    profile.gender = req.gender
    profile.does_sports = does_sports
    profile.sports_days_per_week = sports_days
    profile.goal = req.goal
    profile.has_diabetes = req.has_diabetes
    profile.has_cholesterol = req.has_cholesterol
    profile.has_hypertension = req.has_hypertension

    # Calculated fields (keys match the UserProfile columns 1:1)
    for key, value in metrics.items():
        setattr(profile, key, value)

    user.is_onboarded = True
    db.commit()
    db.refresh(profile)
    return profile
