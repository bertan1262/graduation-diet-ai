import {
  RecognitionResponse,
  ChatMessage,
  MealPlanDay,
  BMRCalculationRequest,
  BMRCalculationResponse,
} from '../types';
import { useDietStore } from '../store/useDietStore';

const getApiBaseUrl = (): string => {
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
};

const isMockEnabled = (): boolean => {
  try {
    const storeMock = useDietStore.getState().useMockData;
    if (typeof storeMock === 'boolean') {
      return storeMock;
    }
  } catch {
    // If invoked before Zustand hydration
  }
  return process.env.EXPO_PUBLIC_USE_MOCK_DATA !== 'false';
};

// Network timeout helper to prevent hanging requests on mobile networks
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}

// Mock data to enable instant parallel mobile UI development & offline reliability
const MOCK_RECOGNITION: RecognitionResponse = {
  timestamp: new Date().toISOString(),
  detectedFoods: [
    {
      id: 'f-1',
      foodName: 'Izgara Tavuk Göğsü',
      portionGrams: 180,
      confidenceScore: 0.94,
      nutrition: {
        calories: 297,
        proteinGrams: 55.8,
        carbsGrams: 0.0,
        fatGrams: 6.5,
      },
    },
    {
      id: 'f-2',
      foodName: 'Kinoa & Akdeniz Salatası',
      portionGrams: 150,
      confidenceScore: 0.88,
      nutrition: {
        calories: 185,
        proteinGrams: 5.2,
        carbsGrams: 28.4,
        fatGrams: 6.1,
      },
    },
  ],
  totalNutrition: {
    calories: 482,
    proteinGrams: 61.0,
    carbsGrams: 28.4,
    fatGrams: 12.6,
  },
  disclaimer: 'Porsiyon ve kalori tahminleri yapay zekâ modelince yapılmıştır; tıbbi tanı veya reçete yerine geçmez.',
};

export const apiService = {
  /**
   * Returns current effective API configuration
   */
  getConfig() {
    return {
      baseUrl: getApiBaseUrl(),
      isMock: isMockEnabled(),
    };
  },

  /**
   * Analyze food image from camera/gallery
   */
  async analyzeFoodImage(imageBase64: string): Promise<RecognitionResponse> {
    if (isMockEnabled()) {
      // Simulate realistic AI inference latency
      await new Promise((r) => setTimeout(r, 1200));
      return MOCK_RECOGNITION;
    }

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetchWithTimeout(
        `${baseUrl}/nutrition/analyze-photo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: imageBase64 }),
        },
        10000
      );

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.warn('Live API call failed, falling back to deterministic mock data:', err);
      return MOCK_RECOGNITION;
    }
  },

  /**
   * Send message to the dietary assistant chatbot with medical guardrail
   */
  async sendChatMessage(messageText: string): Promise<ChatMessage> {
    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 800));
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: `Günlük makro hedeflerinize göre beslenme planınız dengeli ilerliyor! "${messageText}" konusuna ilişkin sağlıklı alternatifleri değerlendirebilirsiniz. Unutmayın, bu tavsiyeler genel beslenme rehberliği amaçlıdır.`,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetchWithTimeout(
        `${baseUrl}/chat/message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageText }),
        },
        8000
      );

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.warn('Chat API failed, falling back to offline guardrail response:', err);
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: `(Çevrimdışı Rehber) "${messageText}" sorunuz incelendi. Canlı sunucuya şu an ulaşılamıyor, ancak genel kural olarak porsiyon kontrolü ve yeterli su tüketimi hedeflerinize ulaşmanıza yardımcı olacaktır.`,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Get personalized weekly meal plan
   */
  async getMealPlan(): Promise<MealPlanDay[]> {
    if (!isMockEnabled()) {
      try {
        const baseUrl = getApiBaseUrl();
        const response = await fetchWithTimeout(
          `${baseUrl}/nutrition/meal-plan`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
          5000
        );
        if (response.ok) {
          return await response.json();
        }
      } catch (err) {
        console.warn('Meal plan API failed, using fallback plan:', err);
      }
    }

    return [
      {
        dayName: 'Pazartesi',
        breakfast: 'Yulaflı omlet, lor peyniri ve taze yeşillik',
        lunch: 'Izgara tavuk göğsü, kinoa ve zeytinyağlı salata',
        dinner: 'Fırın somon ve brokoli',
        snacks: ['1 porsiyon çiğ badem', 'Yeşil elma'],
        targetCalories: 1950,
      },
      {
        dayName: 'Salı',
        breakfast: 'Chia tohumlu yoğurt kasesi ve yaban mersini',
        lunch: 'Mercimek çorbası ve ızgara köfte',
        dinner: 'Zeytinyağlı taze fasulye ve cacık',
        snacks: ['Ceviz', 'Filtre kahve'],
        targetCalories: 1950,
      },
    ];
  },

  /**
   * Clinical BMR, TDEE, and Ideal Weight Calculation Engine
   * Connected to POST /api/v1/nutrition/calculate-bmr
   */
  async calculateBMR(payload: BMRCalculationRequest): Promise<BMRCalculationResponse> {
    if (!isMockEnabled()) {
      try {
        const baseUrl = getApiBaseUrl();
        const response = await fetchWithTimeout(
          `${baseUrl}/nutrition/calculate-bmr`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
          6000
        );

        if (response.ok) {
          return await response.json();
        }
      } catch (err) {
        console.warn('Backend calculate-bmr API unavailable, using clinical engine fallback:', err);
      }
    }

    // Pure clinical calculation fallback mirroring backend calculations.py
    const weight = payload.weight_kg;
    const height = payload.height_cm;
    const age = payload.age;
    const gender = payload.gender;
    const bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(2));

    // 1. Smart BMR Switch: Revised Harris-Benedict (BMI <= 30) vs Mifflin-St Jeor (BMI > 30)
    let bmr: number;
    let bmrFormula: 'revised_harris_benedict' | 'mifflin_st_jeor';
    if (bmi <= 30) {
      bmrFormula = 'revised_harris_benedict';
      if (gender === 'male') {
        bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
      } else {
        bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
      }
    } else {
      bmrFormula = 'mifflin_st_jeor';
      if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }
    }
    bmr = parseFloat(bmr.toFixed(2));

    // 2. Activity Multiplier
    let activityFactor = 1.55;
    let activityLevelName = 'moderate';
    if (payload.activity_factor) {
      activityFactor = payload.activity_factor;
    } else if (payload.sports_days_per_week !== undefined) {
      const days = payload.sports_days_per_week;
      if (days === 0) {
        activityFactor = 1.2;
        activityLevelName = 'sedentary';
      } else if (days <= 2) {
        activityFactor = 1.375;
        activityLevelName = 'light';
      } else if (days <= 4) {
        activityFactor = 1.55;
        activityLevelName = 'moderate';
      } else if (days <= 6) {
        activityFactor = 1.725;
        activityLevelName = 'active';
      } else {
        activityFactor = 1.9;
        activityLevelName = 'very_active';
      }
    } else if (payload.activity_level) {
      activityLevelName = payload.activity_level;
      const map: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
      };
      activityFactor = map[payload.activity_level] || 1.55;
    }

    const tdee = parseFloat((bmr * activityFactor).toFixed(2));

    // 3. Age-adjusted Ideal BMI & Ideal Weight
    let idealBmi = 22;
    if (age <= 24) idealBmi = 21;
    else if (age <= 34) idealBmi = 22;
    else if (age <= 44) idealBmi = 23;
    else if (age <= 54) idealBmi = 24;
    else idealBmi = 25;

    const idealWeightKg = parseFloat((idealBmi * ((height / 100) ** 2)).toFixed(2));

    // Ideal BMR & TDEE
    let idealBmr: number;
    if (idealBmi <= 30) {
      idealBmr =
        gender === 'male'
          ? 88.362 + 13.397 * idealWeightKg + 4.799 * height - 5.677 * age
          : 447.593 + 9.247 * idealWeightKg + 3.098 * height - 4.33 * age;
    } else {
      idealBmr =
        gender === 'male'
          ? 10 * idealWeightKg + 6.25 * height - 5 * age + 5
          : 10 * idealWeightKg + 6.25 * height - 5 * age - 161;
    }
    idealBmr = parseFloat(idealBmr.toFixed(2));
    const idealTdee = parseFloat((idealBmr * activityFactor).toFixed(2));

    // 4. Target Calories based on calculation_basis and goal
    const calculationBasis = payload.calculation_basis || 'current';
    const baseTdee = calculationBasis === 'ideal' ? idealTdee : tdee;

    let targetCalories = baseTdee;
    const goal = payload.goal || 'maintenance';
    if (goal === 'weight_loss') {
      targetCalories = Math.max(1200, baseTdee - 400);
    } else if (goal === 'muscle_gain') {
      targetCalories = baseTdee + 300;
    }
    targetCalories = parseFloat(targetCalories.toFixed(2));

    // 5. Recommended Macronutrients (30% Protein, 40% Carbs, 30% Fat)
    const recommendedProteinG = parseFloat(((targetCalories * 0.3) / 4).toFixed(1));
    const recommendedCarbsG = parseFloat(((targetCalories * 0.4) / 4).toFixed(1));
    const recommendedFatG = parseFloat(((targetCalories * 0.3) / 9).toFixed(1));

    return {
      bmi,
      bmr_formula_used: bmrFormula,
      bmr,
      tdee,
      activity_level: activityLevelName,
      activity_factor: activityFactor,
      ideal_bmi_for_age: idealBmi,
      ideal_weight_kg: idealWeightKg,
      ideal_bmr: idealBmr,
      ideal_tdee: idealTdee,
      calculation_basis: calculationBasis,
      target_calories: targetCalories,
      recommended_protein_g: recommendedProteinG,
      recommended_carbs_g: recommendedCarbsG,
      recommended_fat_g: recommendedFatG,
    };
  },
};
