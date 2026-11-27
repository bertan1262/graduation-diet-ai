"""
Deterministic weekly meal plan for GET /api/v1/nutrition/meal-plan.

Uses the user's `target_calories` from PostgreSQL when logged in and onboarded,
otherwise 2000 kcal. Recipes are fixed templates for now (the AI service can
replace this later without changing the response shape).
"""

from typing import List, Optional

from app.schemas.nutrition import MealPlanDay

DEFAULT_TARGET_CALORIES = 2000

_WEEK_TEMPLATE = [
    ("Pazartesi", "Yulaflı omlet, lor peyniri ve taze yeşillik", "Izgara tavuk göğsü, kinoa ve zeytinyağlı salata", "Fırın somon ve buharda brokoli", ["1 avuç çiğ badem", "Yeşil elma"]),
    ("Salı", "Chia tohumlu yoğurt kasesi ve yaban mersini", "Mercimek çorbası ve ızgara köfte", "Zeytinyağlı taze fasulye ve cacık", ["Ceviz", "Filtre kahve"]),
    ("Çarşamba", "Haşlanmış yumurta, tam buğday ekmeği ve domates-salatalık", "Fırında hindi göğsü ve bulgur pilavı", "Sebzeli kinoa salatası ve ayran", ["Kefir", "Armut"]),
    ("Perşembe", "Peynirli tam buğday tost ve yeşil çay", "Nohutlu ıspanak ve yoğurt", "Izgara levrek ve roka salatası", ["Fındık", "Mandalina"]),
    ("Cuma", "Menemen ve çeyrek avokado", "Tavuklu sebze sote ve esmer pirinç", "Kabak mücver (fırında) ve yoğurt", ["Süzme yoğurt", "Çilek"]),
    ("Cumartesi", "Lor peynirli krep (tam buğday) ve meyve", "Kuru fasulye (az yağlı) ve salata", "Izgara köfte ve közlenmiş sebze", ["Bitter çikolata (2 kare)", "Badem"]),
    ("Pazar", "Serpme kahvaltı (yumurta, peynir, zeytin, sebze)", "Fırın tavuk but ve yeşil salata", "Zeytinyağlı enginar ve mercimek salatası", ["Kefir", "Elma dilimleri ve tarçın"]),
]


def build_weekly_meal_plan(target_calories: Optional[float]) -> List[MealPlanDay]:
    calories = int(round(target_calories)) if target_calories else DEFAULT_TARGET_CALORIES
    return [
        MealPlanDay(
            dayName=day,
            breakfast=breakfast,
            lunch=lunch,
            dinner=dinner,
            snacks=list(snacks),
            targetCalories=calories,
        )
        for day, breakfast, lunch, dinner, snacks in _WEEK_TEMPLATE
    ]
