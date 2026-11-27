from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.database import Base

if TYPE_CHECKING:
    from app.models.nutrition import MealLog


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """
    PostgreSQL table for core user authentication and account state.
    - When a user first signs up, `is_onboarded` is False.
    - Before opening the main app screen, the Mobile Frontend checks `is_onboarded`:
      if False, it shows the Pre-App Onboarding Questionnaire (height, weight, age,
      gender, "Do you do sports?", goal, clinical risks) which creates the linked
      `UserProfile` row and sets `is_onboarded = True`.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Indicates if the user has completed the post-signup Onboarding Questionnaire
    is_onboarded: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    # 1-to-1 Relationship with UserProfile (Onboarding features + BMR/TDEE targets)
    profile: Mapped[Optional["UserProfile"]] = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # 1-to-Many Relationship with MealLogs (daily food photo tracking)
    meal_logs: Mapped[List["MealLog"]] = relationship(
        "MealLog",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class UserProfile(Base):
    """
    PostgreSQL table (`user_profiles`) storing the user's onboarding questionnaire answers
    (anthropometrics, sports habits, clinical risk factors) and their auto-calculated
    clinical BMR, TDEE, BMI, and Ideal Weight metrics.

    Linked 1-to-1 with `users.id` via `user_id`.
    """
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )

    # 1. Core Anthropometrics (Collected during Post-Signup Onboarding)
    full_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    height_cm: Mapped[float] = mapped_column(Float, nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(16), nullable=False)  # "male" | "female"

    # 2. Sports & Activity Features ("Do you do sports?" Onboarding Question)
    does_sports: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sports_days_per_week: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0 to 7
    activity_level: Mapped[str] = mapped_column(String(32), default="sedentary", nullable=False)
    activity_factor: Mapped[float] = mapped_column(Float, default=1.2, nullable=False)

    # 3. Dietary Goal & Clinical Risk Factors (from armağan Stage 1)
    goal: Mapped[str] = mapped_column(String(32), default="maintenance", nullable=False)
    calculation_basis: Mapped[str] = mapped_column(String(16), default="current", nullable=False)  # "current" | "ideal"
    has_diabetes: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_cholesterol: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_hypertension: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # 4. Auto-Calculated Clinical Metrics (Revised Harris-Benedict / Mifflin-St Jeor)
    bmi: Mapped[float] = mapped_column(Float, nullable=False)
    bmr_formula_used: Mapped[str] = mapped_column(
        String(32), default="revised_harris_benedict", nullable=False
    )
    bmr: Mapped[float] = mapped_column(Float, nullable=False)
    tdee: Mapped[float] = mapped_column(Float, nullable=False)

    # 5. Age-Adjusted Ideal Weight & Ideal BMR/TDEE
    ideal_bmi_for_age: Mapped[int] = mapped_column(Integer, nullable=False)
    ideal_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    ideal_bmr: Mapped[float] = mapped_column(Float, nullable=False)
    ideal_tdee: Mapped[float] = mapped_column(Float, nullable=False)

    # 6. Final Daily Calorie & Macronutrient Targets
    target_calories: Mapped[float] = mapped_column(Float, nullable=False)
    recommended_protein_g: Mapped[float] = mapped_column(Float, nullable=False)
    recommended_carbs_g: Mapped[float] = mapped_column(Float, nullable=False)
    recommended_fat_g: Mapped[float] = mapped_column(Float, nullable=False)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="profile")
