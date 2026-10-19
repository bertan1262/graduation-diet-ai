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
    Chat history is stored in MongoDB (ChatLogDocument) linked via user_id.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    # 1-to-1 Relationship with UserProfile (BMR/TDEE & physical metrics)
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
    PostgreSQL table storing the user's physical metrics, dietary goal,
    and calculated Mifflin-St Jeor BMR/TDEE macro targets.
    """
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )

    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    height_cm: Mapped[float] = mapped_column(Float, nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(16), nullable=False)  # "male" | "female"
    activity_level: Mapped[str] = mapped_column(String(32), default="sedentary", nullable=False)
    goal: Mapped[str] = mapped_column(String(32), default="maintenance", nullable=False)

    # Calculated metabolic & daily macro targets
    bmr: Mapped[float] = mapped_column(Float, nullable=False)
    tdee: Mapped[float] = mapped_column(Float, nullable=False)
    target_calories: Mapped[float] = mapped_column(Float, nullable=False)
    recommended_protein_g: Mapped[float] = mapped_column(Float, nullable=False)
    recommended_carbs_g: Mapped[float] = mapped_column(Float, nullable=False)
    recommended_fat_g: Mapped[float] = mapped_column(Float, nullable=False)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="profile")
