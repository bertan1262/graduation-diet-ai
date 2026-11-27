from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.nutrition import BMRCalculationRequest


class ProfileUpdateRequest(BMRCalculationRequest):
    """
    Body of `PUT /api/v1/users/me/profile`.
    Exactly the same JSON as `POST /nutrition/calculate-bmr` (onboarding answers)
    plus an optional `full_name`. The backend recalculates BMI/BMR/TDEE/targets
    and stores everything in PostgreSQL.
    """

    full_name: Optional[str] = Field(default=None, max_length=120)


class ProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: Optional[str] = None

    weight_kg: float
    height_cm: float
    age: int
    gender: str

    does_sports: bool
    sports_days_per_week: int
    activity_level: str
    activity_factor: float

    goal: str
    calculation_basis: str
    has_diabetes: bool
    has_cholesterol: bool
    has_hypertension: bool

    bmi: float
    bmr_formula_used: str
    bmr: float
    tdee: float

    ideal_bmi_for_age: int
    ideal_weight_kg: float
    ideal_bmr: float
    ideal_tdee: float

    target_calories: float
    recommended_protein_g: float
    recommended_carbs_g: float
    recommended_fat_g: float

    updated_at: datetime
