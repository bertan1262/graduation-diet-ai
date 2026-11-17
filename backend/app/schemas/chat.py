"""
Chat API contracts.

Field names intentionally mirror the mobile app's TypeScript types
(`UserDietContext`, `ChatMessage`, `SuggestedMealAction` in mobile/src/types/index.ts),
which is why some fields are camelCase.
"""

from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

SESSION_ID_PATTERN = r"^[A-Za-z0-9_-]{8,64}$"


class UserDietContext(BaseModel):
    """Today's live diet state, computed on the phone and sent with every chat message."""

    model_config = ConfigDict(extra="ignore")

    targetCalories: Optional[float] = None
    consumedCalories: Optional[float] = None
    remainingCalories: Optional[float] = None
    consumedProtein: Optional[float] = None
    targetProtein: Optional[float] = None
    consumedCarbs: Optional[float] = None
    targetCarbs: Optional[float] = None
    consumedFat: Optional[float] = None
    targetFat: Optional[float] = None
    waterIntakeMl: Optional[float] = None
    waterGoalMl: Optional[float] = None
    goal: Optional[str] = Field(default=None, max_length=32)
    currentWeightKg: Optional[float] = None
    targetWeightKg: Optional[float] = None
    bmr: Optional[float] = None
    recentMealNames: Optional[List[str]] = Field(default=None, max_length=20)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    user_context: Optional[UserDietContext] = None
    session_id: Optional[str] = Field(
        default=None,
        pattern=SESSION_ID_PATTERN,
        description=(
            "Conversation id returned by a previous response. Send it back to keep the "
            "conversation memory. Omit it (guest) or send a new one to start a fresh chat."
        ),
    )


class SuggestedMeal(BaseModel):
    """Optional structured meal suggestion the AI service may return (mobile: SuggestedMealAction)."""

    name: str
    portionGrams: float
    mealType: Literal["breakfast", "lunch", "dinner", "snack"]
    calories: float
    proteinGrams: float
    carbsGrams: float
    fatGrams: float
    fiberGrams: Optional[float] = None
    sugarGrams: Optional[float] = None
    sodiumMg: Optional[float] = None


class ChatResponse(BaseModel):
    id: str
    sender: Literal["assistant"] = "assistant"
    content: str
    timestamp: str
    session_id: str
    safety_flag_triggered: bool = False
    isMedicalWarning: bool = False
    suggestedMeal: Optional[SuggestedMeal] = None
    model: Optional[str] = None
    ai_available: bool = True


class ChatHistoryMessage(BaseModel):
    id: str
    sender: Literal["user", "assistant"]
    content: str
    timestamp: str
    safety_flag_triggered: bool = False
    isMedicalWarning: bool = False


class ChatHistoryResponse(BaseModel):
    session_id: Optional[str] = None
    messages: List[ChatHistoryMessage]


class ChatDeleteResponse(BaseModel):
    deleted_turns: int
