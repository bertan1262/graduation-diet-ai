from pydantic import BaseModel, Field
from typing import Dict, List, Optional


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


# ==============================================================================
# FRONTEND INTEGRATION GUIDE — POST-SIGNUP ONBOARDING & BMR/TDEE CALCULATOR
# ==============================================================================
# When a user registers and opens the app for the first time (`user.is_onboarded == False`),
# the Mobile Frontend should display an Onboarding Questionnaire and send the following
# information to `POST /api/v1/nutrition/calculate-bmr`:
#
# 1. REQUIRED BODY METRICS (Must be collected from the user):
#    - `weight_kg` (float): Current weight in kg (e.g., 70.0)
#    - `height_cm` (float): Height in cm (e.g., 170.0)
#    - `age` (int): Age in years (e.g., 30) -> Used for BMR AND age-adjusted Ideal BMI (21-25)
#    - `gender` (str): Biological sex ("male" or "female")
#
# 2. SPORTS / PHYSICAL ACTIVITY (Frontend can send ANY ONE of these 3 options):
#    - Option A (Onboarding Question - Recommended for Mobile UX):
#      Ask "Spor yapıyor musunuz?" (`does_sports`: bool) and if True,
#      "Haftada kaç gün spor yapıyorsunuz?" (`sports_days_per_week`: int, 0-7).
#      Backend automatically maps days/week -> activity_level & multiplier:
#        * 0 days (or does_sports=False) -> "sedentary" (1.2)
#        * 1-2 days/week                 -> "light" (1.375)
#        * 3-4 days/week                 -> "moderate" (1.55)
#        * 5-6 days/week                 -> "active" (1.725)
#        * 7 days/week                   -> "very_active" (1.9)
#    - Option B (Category String):
#      `activity_level`: "sedentary" | "light" | "moderate" | "active" | "very_active"
#    - Option C (Direct Clinical Multiplier):
#      `activity_factor`: 1.2 | 1.375 | 1.55 | 1.725 | 1.9
#
# 3. GOAL & CLINICAL PREFERENCES (Optional, defaults provided):
#    - `goal` (str): "weight_loss" (-400 kcal) | "muscle_gain" (+300 kcal) | "maintenance"
#    - `calculation_basis` (str):
#        * "current" (default): Calculates target_calories from current weight TDEE
#        * "ideal": Calculates target_calories from age-adjusted ideal weight TDEE
#    - `has_diabetes`, `has_cholesterol`, `has_hypertension` (bool): Clinical risk flags
# ==============================================================================


class BMRCalculationRequest(BaseModel):
    # Required anthropometric inputs
    weight_kg: float = Field(..., gt=0, description="User's current weight in kilograms (e.g. 70.0)")
    height_cm: float = Field(..., gt=0, description="User's height in centimeters (e.g. 170.0)")
    age: int = Field(..., gt=0, le=120, description="User's age in years (e.g. 30)")
    gender: str = Field(..., pattern="^(male|female)$", description="Biological sex: 'male' or 'female'")

    # Activity / Sports onboarding inputs (Frontend can send sports questions OR activity_level)
    does_sports: Optional[bool] = Field(
        default=None,
        description="Onboarding question: Does the user exercise/play sports regularly?",
    )
    sports_days_per_week: Optional[int] = Field(
        default=None,
        ge=0,
        le=7,
        description="Onboarding question: Number of days per week the user exercises (0-7)",
    )
    activity_level: str = Field(
        default="sedentary",
        description="sedentary (1.2), light (1.375), moderate (1.55), active (1.725), very_active (1.9)",
    )
    activity_factor: Optional[float] = Field(
        default=None,
        ge=1.0,
        le=2.5,
        description="Optional direct PAL multiplier (e.g. 1.2, 1.375, 1.55, 1.725, 1.9)",
    )

    # Goal & clinical calculation basis
    goal: str = Field(
        default="maintenance",
        description="weight_loss, muscle_gain, or maintenance",
    )
    calculation_basis: str = Field(
        default="current",
        pattern="^(current|ideal)$",
        description="'current' uses current weight TDEE; 'ideal' uses age-adjusted ideal weight TDEE",
    )

    # Optional clinical risk flags from onboarding
    has_diabetes: bool = Field(default=False, description="Diabetes / Insulin resistance flag")
    has_cholesterol: bool = Field(default=False, description="Cholesterol / Hyperlipidemia flag")
    has_hypertension: bool = Field(default=False, description="Hypertension flag")


class BMRCalculationResponse(BaseModel):
    # Current weight calculations
    bmi: float = Field(..., description="Body Mass Index (kg/m^2)")
    bmr_formula_used: str = Field(
        ...,
        description="'revised_harris_benedict' (BMI <= 30) or 'mifflin_st_jeor' (BMI > 30)",
    )
    bmr: float = Field(..., description="Basal Metabolic Rate for current weight (kcal/day)")
    tdee: float = Field(..., description="Total Daily Energy Expenditure for current weight (kcal/day)")

    # Resolved activity info
    activity_level: str = Field(..., description="Resolved activity level category")
    activity_factor: float = Field(..., description="Numeric PAL activity multiplier used")

    # Age-adjusted Ideal Weight calculations (from armağan clinical engine)
    ideal_bmi_for_age: int = Field(..., description="Target BMI based on age bracket (21-25)")
    ideal_weight_kg: float = Field(..., description="Ideal weight in kg for user's height and age")
    ideal_bmr: float = Field(..., description="BMR calculated using ideal weight (kcal/day)")
    ideal_tdee: float = Field(..., description="TDEE calculated using ideal weight (kcal/day)")

    # Final daily calorie & macro targets
    calculation_basis: str = Field(..., description="Whether target_calories was based on 'current' or 'ideal' TDEE")
    target_calories: float = Field(..., description="Recommended daily calorie intake (kcal/day)")
    recommended_protein_g: float = Field(..., description="Recommended daily protein (grams)")
    recommended_carbs_g: float = Field(..., description="Recommended daily carbohydrates (grams)")
    recommended_fat_g: float = Field(..., description="Recommended daily fats (grams)")


class ExchangeCalculationRequest(BaseModel):
    exchange_counts: Dict[str, float] = Field(
        ...,
        description="Mapping of exchange group IDs to portion counts (e.g. {'milk': 2, 'bread': 3, 'meat': 4})",
    )


class ExchangeCalculationResponse(BaseModel):
    kcal: float
    carb: float
    protein: float
    fat: float
