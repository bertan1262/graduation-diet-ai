import base64
import binascii
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_optional_user
from app.core.config import settings
from app.core.middleware import get_request_id
from app.models.database import get_db
from app.models.user import User
from app.schemas.nutrition import (
    BMRCalculationRequest,
    BMRCalculationResponse,
    ExchangeCalculationRequest,
    ExchangeCalculationResponse,
    FoodItemDetection,
    MealPlanDay,
    NutritionalInfo,
    PhotoAnalysisRequest,
    RecognitionResponse,
)
from app.services import ai_client
from app.services.calculations import calculate_exchanges_total
from app.services.meal_plan import build_weekly_meal_plan
from app.services.profile_service import calculate_metrics, upsert_profile

logger = logging.getLogger("dietai.nutrition")

router = APIRouter()

PHOTO_DISCLAIMER = "Yapay zekâ modeli besin ve porsiyon tahmini sunmaktadır. Tıbbi teşhis içermez."

# Returned only when the AI service is down AND AI_MOCK_FALLBACK=true (development).
DEMO_DETECTION: Dict[str, Any] = {
    "detected_items": [
        {"food_name": "Izgara Tavuk Göğsü", "estimated_grams": 180, "confidence": 0.94,
         "calories": 297, "protein": 55.8, "carbs": 0.0, "fat": 6.5},
        {"food_name": "Kinoa & Akdeniz Salatası", "estimated_grams": 150, "confidence": 0.88,
         "calories": 185, "protein": 5.2, "carbs": 28.4, "fat": 6.1},
    ],
}


def _clean_base64(image: str) -> str:
    cleaned = image.strip()
    if cleaned.startswith("data:") and "," in cleaned:
        cleaned = cleaned.split(",", 1)[1]
    return "".join(cleaned.split())  # remove line breaks / spaces


def _num(item: Dict[str, Any], *keys: str) -> float:
    for key in keys:
        value = item.get(key)
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            return float(value)
    return 0.0


def map_detection_to_response(data: Dict[str, Any], disclaimer: str = PHOTO_DISCLAIMER) -> RecognitionResponse:
    """Converts the AI service's snake_case detection JSON into the mobile app's RecognitionResponse."""
    foods: List[FoodItemDetection] = []
    for index, item in enumerate(data.get("detected_items") or []):
        if not isinstance(item, dict):
            continue
        name = item.get("food_name") or item.get("name")
        if not isinstance(name, str) or not name.strip():
            continue
        allergens = item.get("allergens")
        foods.append(
            FoodItemDetection(
                id=f"f-{index + 1}",
                foodName=name.strip(),
                portionGrams=round(_num(item, "estimated_grams", "portion_grams"), 1),
                confidenceScore=round(min(max(_num(item, "confidence"), 0.0), 1.0), 3),
                nutrition=NutritionalInfo(
                    calories=round(_num(item, "calories"), 1),
                    proteinGrams=round(_num(item, "protein", "protein_g"), 1),
                    carbsGrams=round(_num(item, "carbs", "carbs_g"), 1),
                    fatGrams=round(_num(item, "fat", "fat_g"), 1),
                    fiberGrams=round(_num(item, "fiber", "fiber_g"), 1),
                ),
                allergens=[str(a) for a in allergens] if isinstance(allergens, list) else None,
            )
        )

    # Totals are always recomputed here so they can never disagree with the items.
    total = NutritionalInfo(
        calories=round(sum(f.nutrition.calories for f in foods), 1),
        proteinGrams=round(sum(f.nutrition.proteinGrams for f in foods), 1),
        carbsGrams=round(sum(f.nutrition.carbsGrams for f in foods), 1),
        fatGrams=round(sum(f.nutrition.fatGrams for f in foods), 1),
        fiberGrams=round(sum(f.nutrition.fiberGrams or 0.0 for f in foods), 1),
    )
    return RecognitionResponse(
        timestamp=datetime.now(timezone.utc).isoformat(),
        detectedFoods=foods,
        totalNutrition=total,
        disclaimer=disclaimer,
    )


@router.post("/analyze-photo", response_model=RecognitionResponse, tags=["Nutrition"])
async def analyze_photo(payload: PhotoAnalysisRequest, request: Request):
    """
    Receives a food photo (Base64), forwards it to the AI service (`POST /api/v1/cv/detect`)
    and returns detected foods, portions and macros in the mobile app's format.

    If the AI service is down: demo data when AI_MOCK_FALLBACK=true, otherwise HTTP 503.
    """
    image_b64 = _clean_base64(payload.image_base64)
    if not image_b64:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image data is required")
    try:
        base64.b64decode(image_b64, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="image_base64 is not valid base64")

    request_id = get_request_id(request)
    ai_payload: Dict[str, Any] = {"image_base64": image_b64, "request_id": request_id}
    if payload.meal_type:
        ai_payload["meal_type"] = payload.meal_type

    try:
        detection = await ai_client.request_food_detection(ai_payload, request_id=request_id)
    except ai_client.AIServiceError as exc:
        logger.warning("Food detection failed [%s]: %s", request_id, exc)
        if not settings.AI_MOCK_FALLBACK:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is currently unavailable",
            )
        return map_detection_to_response(
            DEMO_DETECTION,
            disclaimer="DEMO VERİSİ: AI servisine ulaşılamadı, örnek sonuç gösteriliyor. " + PHOTO_DISCLAIMER,
        )

    return map_detection_to_response(detection)


@router.post("/calculate-bmr", response_model=BMRCalculationResponse, tags=["Nutrition"])
def calculate_bmr_endpoint(
    req: BMRCalculationRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    Clinical BMR, TDEE, BMI, and Age-Adjusted Ideal Weight Calculator.

    Works WITHOUT login (pure calculation). If the request has a valid
    `Authorization: Bearer <access_token>`, the answers and results are ALSO saved
    to the user's profile in PostgreSQL and `is_onboarded` becomes true.

    What Frontend needs to send (during Post-Signup Onboarding or Profile Update):
    - Required: `weight_kg`, `height_cm`, `age`, `gender` ("male" | "female")
    - Activity (any one of):
        * Onboarding sports questions: `does_sports` (bool) & `sports_days_per_week` (0-7)
        * Category string: `activity_level` ("sedentary", "light", "moderate", "active", "very_active")
        * Numeric multiplier: `activity_factor` (1.2, 1.375, 1.55, 1.725, 1.9)
    - Optional:
        * `goal`: "weight_loss" | "muscle_gain" | "maintenance"
        * `calculation_basis`: "current" (default) | "ideal" (uses ideal weight TDEE)

    Formula Logic:
    - BMI <= 30: Revised Harris-Benedict (Roza & Shizgal, 1984)
    - BMI > 30: Mifflin-St Jeor (obesity-adjusted clinical formula)
    """
    result = calculate_metrics(req)
    if current_user is not None:
        upsert_profile(db, current_user, req, metrics=result)
    return BMRCalculationResponse(**result)


@router.post("/calculate-exchanges", response_model=ExchangeCalculationResponse, tags=["Nutrition"])
def calculate_exchanges_endpoint(req: ExchangeCalculationRequest):
    """
    Calculates total kcal, carbohydrate, protein, and fat grams from food exchange counts
    (milk, milk_yy, bread, meat, egg_cheese, vegetable, fruit, fat, oil_seed).
    """
    totals = calculate_exchanges_total(req.exchange_counts)
    return ExchangeCalculationResponse(**totals)


@router.get("/meal-plan", response_model=List[MealPlanDay], tags=["Nutrition"])
def get_meal_plan(current_user: Optional[User] = Depends(get_optional_user)):
    """
    7-day meal plan (mobile: apiService.getMealPlan). Uses the logged-in user's
    `target_calories` if onboarded, otherwise 2000 kcal. Login optional.
    """
    target = None
    if current_user is not None and current_user.profile is not None:
        target = current_user.profile.target_calories
    return build_weekly_meal_plan(target)
