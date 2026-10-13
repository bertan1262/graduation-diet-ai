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

export interface UserDietProfile {
  bmr: number;
  dailyCalorieTarget: number;
  dietaryGoal: 'weight_loss' | 'muscle_gain' | 'maintenance';
  allergies: string[];
}
