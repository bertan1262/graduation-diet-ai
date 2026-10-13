from pydantic import BaseModel, Field
from typing import List, Optional

class NutritionalInfo(BaseModel):
    calories: float = Field(..., description="Estimated total calories in kcal")
    proteinGrams: float = Field(..., description="Estimated protein in grams")
    carbsGrams: float = Field(..., description="Estimated carbohydrates in grams")
    fatGrams: float = Field(..., description="Estimated fats in grams")
    fiberGrams: Optional[float] = 0.0

class FoodItemDetection(BaseModel):
    id: str
    foodName: str
    portionGrams: float
    confidenceScore: float
    nutrition: NutritionalInfo

class PhotoAnalysisRequest(BaseModel):
    image_base64: str

class RecognitionResponse(BaseModel):
    timestamp: str
    detectedFoods: List[FoodItemDetection]
    totalNutrition: NutritionalInfo
    disclaimer: str = "Tüm porsiyon ve besin hesaplamaları yapay zekâ tahmini olup tıbbi teşhis niteliği taşımaz."

class BMRCalculationRequest(BaseModel):
    weight_kg: float
    height_cm: float
    age: int
    gender: str = Field(..., pattern="^(male|female)$")
    activity_level: str = Field("sedentary", description="sedentary, light, moderate, active, very_active")
    goal: str = Field("maintenance", description="weight_loss, muscle_gain, maintenance")

class BMRCalculationResponse(BaseModel):
    bmr: float
    tdee: float
    target_calories: float
    recommended_protein_g: float
    recommended_carbs_g: float
    recommended_fat_g: float
