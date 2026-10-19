from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.schemas.nutrition import (
    PhotoAnalysisRequest,
    RecognitionResponse,
    BMRCalculationRequest,
    BMRCalculationResponse,
    ExchangeCalculationRequest,
    ExchangeCalculationResponse,
    FoodItemDetection,
    NutritionalInfo,
)
from app.services.calculations import (
    calculate_exchanges_total,
    calculate_full_anthropometrics,
)

router = APIRouter()


@router.post("/analyze-photo", response_model=RecognitionResponse, tags=["Nutrition"])
async def analyze_photo(payload: PhotoAnalysisRequest):
    """
    Receives food photo (Base64) and returns identified items, portions, and macros.
    Forwards to AI service if reachable, otherwise returns structured initial data.
    """
    if not payload.image_base64:
        raise HTTPException(status_code=400, detail="Image data is required")

    # Initial mock/staging response aligned with frontend contract
    return RecognitionResponse(
        timestamp=datetime.utcnow().isoformat(),
        detectedFoods=[
            FoodItemDetection(
                id="f-1",
                foodName="Izgara Tavuk Göğsü",
                portionGrams=180.0,
                confidenceScore=0.94,
                nutrition=NutritionalInfo(
                    calories=297.0,
                    proteinGrams=55.8,
                    carbsGrams=0.0,
                    fatGrams=6.5,
                ),
            ),
            FoodItemDetection(
                id="f-2",
                foodName="Kinoa & Akdeniz Salatası",
                portionGrams=150.0,
                confidenceScore=0.88,
                nutrition=NutritionalInfo(
                    calories=185.0,
                    proteinGrams=5.2,
                    carbsGrams=28.4,
                    fatGrams=6.1,
                ),
            ),
        ],
        totalNutrition=NutritionalInfo(
            calories=482.0,
            proteinGrams=61.0,
            carbsGrams=28.4,
            fatGrams=12.6,
        ),
        disclaimer="Yapay zekâ modeli besin ve porsiyon tahmini sunmaktadır. Tıbbi teşhis içermez.",
    )


@router.post("/calculate-bmr", response_model=BMRCalculationResponse, tags=["Nutrition"])
def calculate_bmr_endpoint(req: BMRCalculationRequest):
    """
    Clinical BMR, TDEE, BMI, and Age-Adjusted Ideal Weight Calculator.

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
    result = calculate_full_anthropometrics(
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
    return BMRCalculationResponse(**result)


@router.post("/calculate-exchanges", response_model=ExchangeCalculationResponse, tags=["Nutrition"])
def calculate_exchanges_endpoint(req: ExchangeCalculationRequest):
    """
    Calculates total kcal, carbohydrate, protein, and fat grams from food exchange counts
    (milk, milk_yy, bread, meat, egg_cheese, vegetable, fruit, fat, oil_seed).
    """
    totals = calculate_exchanges_total(req.exchange_counts)
    return ExchangeCalculationResponse(**totals)
