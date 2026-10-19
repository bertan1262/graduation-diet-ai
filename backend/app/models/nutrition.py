from datetime import datetime, timezone
from typing import TYPE_CHECKING, List
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String # type: ignore
from sqlalchemy.orm import Mapped, mapped_column, relationship # type: ignore
from app.models.database import Base

if TYPE_CHECKING:
    from app.models.user import User


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MealLog(Base):
    """
    PostgreSQL table representing a logged meal (e.g., from AI photo recognition)
    and its aggregated macronutrient totals.
    """
    __tablename__ = "meal_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    meal_type: Mapped[str] = mapped_column(String(32), default="general", nullable=False)

    # Aggregated meal macros
    total_calories: Mapped[float] = mapped_column(Float, nullable=False)
    total_protein_g: Mapped[float] = mapped_column(Float, nullable=False)
    total_carbs_g: Mapped[float] = mapped_column(Float, nullable=False)
    total_fat_g: Mapped[float] = mapped_column(Float, nullable=False)
    total_fiber_g: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, index=True, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="meal_logs")
    detected_items: Mapped[List["MealFoodItem"]] = relationship(
        "MealFoodItem",
        back_populates="meal_log",
        cascade="all, delete-orphan",
    )


class MealFoodItem(Base):
    """
    PostgreSQL table storing individual food items detected on a plate
    within a single MealLog.
    """
    __tablename__ = "meal_food_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meal_log_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meal_logs.id", ondelete="CASCADE"), nullable=False, index=True
    )

    food_name: Mapped[str] = mapped_column(String(120), nullable=False)
    portion_grams: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)

    calories: Mapped[float] = mapped_column(Float, nullable=False)
    protein_grams: Mapped[float] = mapped_column(Float, nullable=False)
    carbs_grams: Mapped[float] = mapped_column(Float, nullable=False)
    fat_grams: Mapped[float] = mapped_column(Float, nullable=False)
    fiber_grams: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    meal_log: Mapped["MealLog"] = relationship("MealLog", back_populates="detected_items")
