export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type ServingUnitType = 'g' | 'portion' | 'piece' | 'slice' | 'bowl';

export interface NutritionalInfo {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
}

export interface FoodItemDetection {
  id: string;
  foodName: string;
  portionGrams: number;
  confidenceScore: number;
  nutrition: NutritionalInfo;
  allergens?: string[];
  pinPosition?: { topPercent: number; leftPercent: number };
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
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
  servingUnit?: ServingUnitType;
  servingCount?: number;
  loggedAt: string; // ISO string or time "12:30"
  imageUrl?: string;
  allergens?: string[];
  warningMessage?: string;
}

export interface SuggestedMealAction {
  name: string;
  portionGrams: number;
  mealType: MealType;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
}

export interface PendingMealAnalysis {
  status: 'idle' | 'analyzing' | 'ready' | 'error';
  imageUri?: string;
  startedAt?: number;
  detectedFood?: FoodItemDetection;
  detectedFoods?: FoodItemDetection[];
}

export interface CustomRecipeIngredient {
  id: string;
  name: string;
  grams: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
}

export interface CustomRecipe {
  id: string;
  title: string;
  servings: number;
  ingredients: CustomRecipeIngredient[];
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalFiberGrams: number;
  totalGrams: number;
}

export interface ProgressPhotoEntry {
  id: string;
  dateStr: string;
  weightKg: number;
  imageUri: string;
  label: string;
}

export interface WeeklyWeightEntry {
  id: string;
  dateStr: string;
  weekLabel: string;
  weightKg: number;
  previousWeightKg: number;
  deltaKg: number;
  goalAtLog: DietaryGoal;
  caloriesAdjustedTo?: number;
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
  // Cal AI & Calz Onboarding Wizard additions
  weeklyPaceKg?: number;
  dailyMealsCount?: number;
  firstMealTime?: string;
  lastMealTime?: string;
  weekendFlexibility?: boolean;
  dietType?: string;
  mainObstacles?: string[];
}

export interface UserDietContext {
  targetCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  consumedProtein: number;
  targetProtein: number;
  consumedCarbs: number;
  targetCarbs: number;
  consumedFat: number;
  targetFat: number;
  waterIntakeMl: number;
  waterGoalMl: number;
  goal: string;
  currentWeightKg: number;
  targetWeightKg?: number;
  bmr: number;
  recentMealNames?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isMedicalWarning?: boolean;
  safety_flag_triggered?: boolean;
  suggestedMeal?: SuggestedMealAction;
}

export interface MealPlanDay {
  dayName: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string[];
  targetCalories: number;
}

export interface MealRecipe {
  id: string;
  title: string;
  description: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  tags: string[];
  allergens?: ('lactose' | 'gluten' | 'peanut' | 'egg' | 'seafood')[];
  dietTypes?: ('vegetarian' | 'vegan' | 'keto' | 'balanced' | 'high_protein')[];
}

export interface DayPlan {
  dayId: string;
  dayName: string;
  dayShort: string;
  dayOfMonth: number;
  monthName: string;
  isToday: boolean;
  breakfast: MealRecipe;
  lunch: MealRecipe;
  dinner: MealRecipe;
  snack: MealRecipe;
}
