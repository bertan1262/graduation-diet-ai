"""
Clinical Anthropometric, BMR, TDEE, Ideal Weight & Food Exchange Calculator Service.
Ported from DietAssist Pro (armağan) clinical calculation engine and extended with
onboarding sports-frequency mapping for the DietAI Mobile App.
"""

from typing import Any, Dict, Optional, Tuple

ACTIVITY_MULTIPLIERS: Dict[str, float] = {
    "sedentary": 1.2,      # Hareketsiz (Masa başı iş, spor yok)
    "light": 1.375,        # Az Hareketli (Haftada 1-2 gün hafif spor)
    "moderate": 1.55,      # Orta Hareketli (Haftada 3-4 gün orta düzey spor)
    "active": 1.725,       # Çok Hareketli (Haftada 5-6 gün yoğun spor)
    "very_active": 1.9,    # Aşırı Hareketli (Haftada 7 gün / profesyonel sporcu)
}

EXCHANGE_VALUES: Dict[str, Dict[str, float]] = {
    "milk": {"kcal": 114, "carb": 9, "protein": 6, "fat": 6},
    "milk_yy": {"kcal": 87, "carb": 9, "protein": 6, "fat": 3},
    "bread": {"kcal": 68, "carb": 15, "protein": 2, "fat": 0},
    "meat": {"kcal": 69, "carb": 0, "protein": 6, "fat": 5},
    "egg_cheese": {"kcal": 69, "carb": 0, "protein": 6, "fat": 5},
    "vegetable": {"kcal": 28, "carb": 6, "protein": 1, "fat": 0},
    "fruit": {"kcal": 60, "carb": 15, "protein": 0, "fat": 0},
    "fat": {"kcal": 45, "carb": 0, "protein": 0, "fat": 5},
    "oil_seed": {"kcal": 53, "carb": 0, "protein": 2, "fat": 5},
}

DEFAULT_FOODS = [
    {"id": "milk", "label": "Süt", "carb": 9, "protein": 6, "fat": 6},
    {"id": "milk_yy", "label": "Süt (YY)", "carb": 9, "protein": 6, "fat": 3},
    {"id": "bread", "label": "Ekmek", "carb": 15, "protein": 2, "fat": 0},
    {"id": "meat", "label": "Et", "carb": 0, "protein": 6, "fat": 5},
    {"id": "egg_cheese", "label": "Yumurta/Peynir", "carb": 0, "protein": 6, "fat": 5},
    {"id": "vegetable", "label": "Sebze", "carb": 6, "protein": 1, "fat": 0},
    {"id": "fruit", "label": "Meyve", "carb": 15, "protein": 0, "fat": 0},
    {"id": "fat", "label": "Yağ", "carb": 0, "protein": 0, "fat": 5},
    {"id": "oil_seed", "label": "Yağlı Tohum", "carb": 0, "protein": 2, "fat": 5},
]


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    """Calculate BMI (Body Mass Index) given weight in kg and height in cm."""
    if height_cm <= 0 or weight_kg <= 0:
        return 0.0
    height_m = height_cm / 100.0
    return round(weight_kg / (height_m ** 2), 2)


def calculate_bmr_with_formula(
    weight_kg: float, height_cm: float, age_years: int, gender: str
) -> Tuple[float, str]:
    """
    Calculate BMR using an intelligent clinical formula switch:
    - Revised Harris-Benedict (Roza & Shizgal, 1984) for BMI <= 30 (general gold standard)
    - Mifflin-St Jeor for BMI > 30 (more accurate for obese individuals)

    Returns:
        Tuple of (bmr_kcal, formula_name)
    """
    bmi = calculate_bmi(weight_kg, height_cm)
    is_male = gender.lower() == "male"

    if bmi > 30:
        # Mifflin-St Jeor (obezite durumu için daha uygun)
        if is_male:
            bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) + 5
        else:
            bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) - 161
        return round(bmr, 2), "mifflin_st_jeor"
    else:
        # Revised Harris-Benedict (genel kullanım için altın standart)
        if is_male:
            bmr = 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age_years)
        else:
            bmr = 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age_years)
        return round(bmr, 2), "revised_harris_benedict"


def calculate_bmr(weight_kg: float, height_cm: float, age_years: int, gender: str) -> float:
    """
    Calculate BMR value (kcal/day).
    Compatible directly with armağan/backend/calculations.py signature.
    """
    bmr, _ = calculate_bmr_with_formula(weight_kg, height_cm, age_years, gender)
    return bmr


def calculate_tdee(bmr: float, activity_factor: float) -> float:
    """Calculate TDEE based on BMR and activity factor (1.2 to 1.9)."""
    return round(bmr * activity_factor, 2)


def get_ideal_bmi_for_age(age_years: int) -> int:
    """Yaşa göre hedef BKİ (Ideal BMI) değerini döndürür."""
    if age_years <= 24:
        return 21
    elif age_years <= 34:
        return 22
    elif age_years <= 44:
        return 23
    elif age_years <= 54:
        return 24
    else:
        return 25


def calculate_ideal_weight(height_cm: float, age_years: int) -> float:
    """Yaşa uygun hedef BKİ ile ideal kiloyu (kg) hesaplar."""
    ideal_bmi = get_ideal_bmi_for_age(age_years)
    height_m = height_cm / 100.0
    return round(ideal_bmi * (height_m ** 2), 2)


def resolve_activity_from_sports(
    activity_level: Optional[str] = "sedentary",
    activity_factor: Optional[float] = None,
    does_sports: Optional[bool] = None,
    sports_days_per_week: Optional[int] = None,
) -> Tuple[str, float]:
    """
    Determines the user's activity_level key and numeric multiplier (1.2 - 1.9).
    Priority:
    1. Explicit numeric `activity_factor` (e.g. 1.55 from clinical dropdown)
    2. Onboarding sports questions (`does_sports` & `sports_days_per_week`)
    3. Named `activity_level` string ("sedentary", "light", "moderate", "active", "very_active")
    """
    if activity_factor is not None and 1.0 <= activity_factor <= 2.5:
        # Reverse-match closest named level for database storage
        closest_level = min(
            ACTIVITY_MULTIPLIERS.keys(),
            key=lambda k: abs(ACTIVITY_MULTIPLIERS[k] - activity_factor),
        )
        return closest_level, round(activity_factor, 3)

    if does_sports is not None or sports_days_per_week is not None:
        if does_sports is False or (sports_days_per_week is not None and sports_days_per_week <= 0):
            return "sedentary", ACTIVITY_MULTIPLIERS["sedentary"]
        days = sports_days_per_week if sports_days_per_week is not None else 2
        if days <= 2:
            return "light", ACTIVITY_MULTIPLIERS["light"]
        elif days <= 4:
            return "moderate", ACTIVITY_MULTIPLIERS["moderate"]
        elif days <= 6:
            return "active", ACTIVITY_MULTIPLIERS["active"]
        else:
            return "very_active", ACTIVITY_MULTIPLIERS["very_active"]

    level_key = (activity_level or "sedentary").lower()
    factor = ACTIVITY_MULTIPLIERS.get(level_key, 1.2)
    return level_key if level_key in ACTIVITY_MULTIPLIERS else "sedentary", factor


def calculate_full_anthropometrics(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
    activity_level: str = "sedentary",
    activity_factor: Optional[float] = None,
    does_sports: Optional[bool] = None,
    sports_days_per_week: Optional[int] = None,
    goal: str = "maintenance",
    calculation_basis: str = "current",
) -> Dict[str, Any]:
    """
    Executes the full clinical calculation pipeline:
    1. Current BMI
    2. Current BMR (Revised Harris-Benedict for BMI <= 30, Mifflin-St Jeor for BMI > 30)
    3. Resolved Activity Level & Factor (from sports questionnaire or direct input)
    4. Current TDEE
    5. Age-adjusted Ideal BMI, Ideal Weight (kg), Ideal BMR, and Ideal TDEE
    6. Goal-adjusted Target Calories & Daily Macro Targets (30% Protein, 40% Carbs, 30% Fat)
    """
    bmi = calculate_bmi(weight_kg, height_cm)
    bmr, formula_used = calculate_bmr_with_formula(weight_kg, height_cm, age, gender)

    resolved_level, resolved_factor = resolve_activity_from_sports(
        activity_level=activity_level,
        activity_factor=activity_factor,
        does_sports=does_sports,
        sports_days_per_week=sports_days_per_week,
    )

    tdee = calculate_tdee(bmr, resolved_factor)

    # Ideal Weight Calculations (armağan Stage 1 "İdeal Kiloya Göre" card)
    ideal_bmi = get_ideal_bmi_for_age(age)
    ideal_weight_kg = calculate_ideal_weight(height_cm, age)
    ideal_bmr, _ = calculate_bmr_with_formula(ideal_weight_kg, height_cm, age, gender)
    ideal_tdee = calculate_tdee(ideal_bmr, resolved_factor)

    # Choose base TDEE ("current" vs "ideal" weight basis)
    base_tdee = ideal_tdee if calculation_basis == "ideal" else tdee

    # Adjust target calories based on user goal
    if goal == "weight_loss":
        target_calories = base_tdee - 400.0
    elif goal == "muscle_gain":
        target_calories = base_tdee + 300.0
    else:
        target_calories = base_tdee

    # Ethical safety floor: never recommend dangerously low shock diets (< 1200 kcal)
    target_calories = max(round(target_calories, 2), 1200.0)

    # Standard macro distribution (30% Protein, 40% Carbs, 30% Fat)
    protein_g = round((target_calories * 0.30) / 4.0, 1)
    carbs_g = round((target_calories * 0.40) / 4.0, 1)
    fat_g = round((target_calories * 0.30) / 9.0, 1)

    return {
        "bmi": bmi,
        "bmr_formula_used": formula_used,
        "bmr": bmr,
        "tdee": tdee,
        "activity_level": resolved_level,
        "activity_factor": resolved_factor,
        "ideal_bmi_for_age": ideal_bmi,
        "ideal_weight_kg": ideal_weight_kg,
        "ideal_bmr": ideal_bmr,
        "ideal_tdee": ideal_tdee,
        "calculation_basis": calculation_basis,
        "target_calories": target_calories,
        "recommended_protein_g": protein_g,
        "recommended_carbs_g": carbs_g,
        "recommended_fat_g": fat_g,
    }


def calculate_exchanges_total(
    exchange_counts: Dict[str, float],
    custom_macros: Optional[Dict[str, Dict[str, float]]] = None,
) -> Dict[str, float]:
    """
    Given a dict of exchange counts (e.g., {'milk': 2, 'bread': 4, ...}),
    return total kcal, carb, protein, fat.
    """
    totals = {"kcal": 0.0, "carb": 0.0, "protein": 0.0, "fat": 0.0}
    macros = custom_macros if custom_macros else EXCHANGE_VALUES
    for group, count in exchange_counts.items():
        if group in macros and count > 0:
            for macro in totals:
                totals[macro] += macros[group][macro] * count

    return {k: round(v, 2) for k, v in totals.items()}
