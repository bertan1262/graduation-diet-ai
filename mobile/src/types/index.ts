export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface NutritionalInfo {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
}

export interface FoodItemDetection {
  id: string;
  foodName: string;
  portionGrams: number;
  confidenceScore: number;
  nutrition: NutritionalInfo;
  allergens?: string[];
}

export interface RecognitionResponse {
  timestamp: string;
  detectedFoods: FoodItemDetection[];
  totalNutrition: NutritionalInfo;
  disclaimer: string;
}

export interface LoggedMealItem {
  id: string;
  name: string;
  portionGrams: number;
  mealType: MealType;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  loggedAt: string; // ISO string or time "12:30"
  imageUrl?: string;
  allergens?: string[];
  warningMessage?: string;
}

export interface DailyAnalyticsRecord {
  date: string;
  dayLabel: string;
  calories: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterMl: number;
  waterGoalMl: number;
  weightKg: number;
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type DietaryGoal = 'weight_loss' | 'muscle_gain' | 'maintenance';
export type CalculationBasis = 'current' | 'ideal';

export interface BMRCalculationRequest {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: 'male' | 'female';
  does_sports?: boolean;
  sports_days_per_week?: number;
  activity_level?: ActivityLevel;
  activity_factor?: number;
  goal?: DietaryGoal;
  calculation_basis?: CalculationBasis;
  has_diabetes?: boolean;
  has_cholesterol?: boolean;
  has_hypertension?: boolean;
}

export interface BMRCalculationResponse {
  bmi: number;
  bmr_formula_used: 'revised_harris_benedict' | 'mifflin_st_jeor' | string;
  bmr: number;
  tdee: number;
  activity_level: string;
  activity_factor: number;
  ideal_bmi_for_age: number;
  ideal_weight_kg: number;
  ideal_bmr: number;
  ideal_tdee: number;
  calculation_basis: CalculationBasis;
  target_calories: number;
  recommended_protein_g: number;
  recommended_carbs_g: number;
  recommended_fat_g: number;
}

export interface UserProfile {
  name: string;
  gender: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  activityLevel: ActivityLevel;
  dietaryGoal: DietaryGoal;
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  waterGoalMl: number;
  allergies: string[];
  // Clinical additions from Backend
  doesSports?: boolean;
  sportsDaysPerWeek?: number;
  calculationBasis?: CalculationBasis;
  hasDiabetes?: boolean;
  hasCholesterol?: boolean;
  hasHypertension?: boolean;
  bmrFormulaUsed?: string;
  idealWeightKg?: number;
  bmi?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isMedicalWarning?: boolean;
}

export interface MealPlanDay {
  dayName: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string[];
  targetCalories: number;
}
