from app.services.calculations import (
    calculate_bmi,
    calculate_bmr,
    calculate_exchanges_total,
    calculate_full_anthropometrics,
    calculate_ideal_weight,
    calculate_tdee,
    resolve_activity_from_sports,
)


def test_calculate_bmi():
    assert calculate_bmi(70, 170) == 24.22
    assert calculate_bmi(0, 170) == 0.0


def test_calculate_bmr_formula_switch():
    # BMI <= 30: Revised Harris-Benedict
    # Male (70kg, 170cm, 30y): 88.362 + (13.397 * 70) + (4.799 * 170) - (5.677 * 30) = 1671.67
    assert calculate_bmr(70, 170, 30, "male") == 1671.67
    # Female (60kg, 160cm, 25y): 447.593 + (9.247 * 60) + (3.098 * 160) - (4.330 * 25) = 1389.84
    assert calculate_bmr(60, 160, 25, "female") == 1389.84
    # BMI > 30 (Obese): Mifflin-St Jeor
    # Male (100kg, 170cm, 30y): (10 * 100) + (6.25 * 170) - (5 * 30) + 5 = 1917.5
    assert calculate_bmr(100, 170, 30, "male") == 1917.5


def test_calculate_tdee_and_ideal_weight():
    assert calculate_tdee(1000, 1.2) == 1200.0
    # Age 30 -> Ideal BMI = 22 -> 22 * (1.70^2) = 63.58 kg
    assert calculate_ideal_weight(170, 30) == 63.58


def test_resolve_activity_from_sports_onboarding():
    assert resolve_activity_from_sports(does_sports=False) == ("sedentary", 1.2)
    assert resolve_activity_from_sports(does_sports=True, sports_days_per_week=2) == ("light", 1.375)
    assert resolve_activity_from_sports(does_sports=True, sports_days_per_week=4) == ("moderate", 1.55)
    assert resolve_activity_from_sports(does_sports=True, sports_days_per_week=6) == ("active", 1.725)
    assert resolve_activity_from_sports(does_sports=True, sports_days_per_week=7) == ("very_active", 1.9)


def test_calculate_full_anthropometrics():
    res = calculate_full_anthropometrics(
        weight_kg=70,
        height_cm=170,
        age=30,
        gender="male",
        does_sports=True,
        sports_days_per_week=3,
        goal="weight_loss",
        calculation_basis="current",
    )
    assert res["bmi"] == 24.22
    assert res["bmr_formula_used"] == "revised_harris_benedict"
    assert res["bmr"] == 1671.67
    assert res["activity_level"] == "moderate"
    assert res["activity_factor"] == 1.55
    assert res["ideal_bmi_for_age"] == 22
    assert res["ideal_weight_kg"] == 63.58


def test_calculate_exchanges_total():
    counts = {
        "milk": 2,    # 2 * 114 = 228
        "bread": 3,   # 3 * 68 = 204
        "meat": 0,
    }
    totals = calculate_exchanges_total(counts)
    assert totals["kcal"] == 432.0
    assert totals["carb"] == 63.0
    assert totals["protein"] == 18.0
