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
}

export interface UserProfile {
  name: string;
  gender: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietaryGoal: 'weight_loss' | 'muscle_gain' | 'maintenance';
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  waterGoalMl: number;
  allergies: string[];
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
