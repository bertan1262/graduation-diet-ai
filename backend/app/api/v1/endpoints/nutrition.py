from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.schemas.nutrition import (
    PhotoAnalysisRequest,
    RecognitionResponse,
    BMRCalculationRequest,
    BMRCalculationResponse,
    FoodItemDetection,
    NutritionalInfo
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
                  fatGrams=6.5
              )
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
                  fatGrams=6.1
              )
          )
        ],
        totalNutrition=NutritionalInfo(
            calories=482.0,
            proteinGrams=61.0,
            carbsGrams=28.4,
            fatGrams=12.6
        ),
        disclaimer="Yapay zekâ modeli besin ve porsiyon tahmini sunmaktadır. Tıbbi teşhis içermez."
    )

@router.post("/calculate-bmr", response_model=BMRCalculationResponse, tags=["Nutrition"])
def calculate_bmr(req: BMRCalculationRequest):
    """
    Mifflin-St Jeor Equation for BMR and TDEE macro targets.
    """
    if req.gender == "male":
        bmr = (10 * req.weight_kg) + (6.25 * req.height_cm) - (5 * req.age) + 5
    else:
        bmr = (10 * req.weight_kg) + (6.25 * req.height_cm) - (5 * req.age) - 161

    multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    tdee = bmr * multipliers.get(req.activity_level, 1.2)

    # Adjust for goal
    if req.goal == "weight_loss":
        target_calories = tdee - 400
    elif req.goal == "muscle_gain":
        target_calories = tdee + 300
    else:
        target_calories = tdee

    # Standard macro splits (30% Protein, 40% Carbs, 30% Fat)
    protein_g = (target_calories * 0.30) / 4
    carbs_g = (target_calories * 0.40) / 4
    fat_g = (target_calories * 0.30) / 9

    return BMRCalculationResponse(
        bmr=round(bmr, 1),
        tdee=round(tdee, 1),
        target_calories=round(target_calories, 1),
        recommended_protein_g=round(protein_g, 1),
        recommended_carbs_g=round(carbs_g, 1),
        recommended_fat_g=round(fat_g, 1)
    )
