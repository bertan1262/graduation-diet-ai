import {
  RecognitionResponse,
  ChatMessage,
  UserDietContext,
  MealPlanDay,
  BMRCalculationRequest,
  BMRCalculationResponse,
} from '../types';
import { useDietStore } from '../store/useDietStore';
import { secureStorage } from './secureStorage';

const DEFAULT_DEV_API_URL = 'http://localhost:8000/api/v1';
const DEFAULT_PROD_API_URL = 'https://api.dietai.app/api/v1';

/**
 * Resolves the API Base URL and strictly enforces HTTPS in production builds (!__DEV__).
 * In development (__DEV__), local HTTP URLs (localhost / 192.168.x.x) are permitted for LAN testing.
 */
export const resolveApiBaseUrl = (): string => {
  const isDevEnv = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
  const rawEnvUrl = (
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    ''
  ).trim();

  if (!rawEnvUrl) {
    return isDevEnv ? DEFAULT_DEV_API_URL : DEFAULT_PROD_API_URL;
  }

  // Strip trailing slash for consistent endpoint concatenation
  const normalizedUrl = rawEnvUrl.replace(/\/+$/, '');

  if (!isDevEnv && normalizedUrl.startsWith('http://')) {
    const isLoopback =
      normalizedUrl.startsWith('http://localhost') ||
      normalizedUrl.startsWith('http://127.0.0.1');
    if (!isLoopback) {
      console.warn(
        '[Security] Insecure HTTP API URL detected in production build. Automatically enforcing HTTPS.'
      );
      return normalizedUrl.replace(/^http:\/\//i, 'https://');
    }
  }

  return normalizedUrl;
};

/**
 * Builds request headers and automatically attaches `Authorization: Bearer <token>`
 * from hardware-backed `expo-secure-store` when a session token is present.
 */
async function buildRequestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const token = await secureStorage.getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

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

const MEDICAL_GUARDRAIL_KEYWORDS = [
  'ilaç',
  'tedavi',
  'hastalık',
  'ağrı',
  'reçete',
  'tansiyon',
  'diyabet',
  'teşhis',
  'antibiyotik',
  'kanser',
  'guatr',
];

export function isMedicalQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return MEDICAL_GUARDRAIL_KEYWORDS.some((kw) => lower.includes(kw));
}

// Network timeout helper with automatic 401 token cleanup
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    if (res.status === 401) {
      await secureStorage.clearAuthToken();
    }
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
  disclaimer:
    'Porsiyon ve kalori tahminleri yapay zekâ modelince yapılmıştır; tıbbi tanı veya reçete yerine geçmez.',
};

export const apiService = {
  /**
   * Returns current effective API & security configuration
   */
  getConfig() {
    const baseUrl = resolveApiBaseUrl();
    return {
      baseUrl,
      isHttps: baseUrl.startsWith('https://'),
      isMock: isMockEnabled(),
      isSecureStoreActive: secureStorage.isHardwareEncrypted(),
    };
  },

  /**
   * Persist or clear JWT tokens in hardware-backed Expo SecureStore
   */
  async setSessionTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await secureStorage.setAuthToken(accessToken);
    if (refreshToken) {
      await secureStorage.setRefreshToken(refreshToken);
    }
  },

  async clearSessionTokens(): Promise<void> {
    await secureStorage.clearAuthToken();
  },

  /**
   * Analyze food image from camera/gallery with Gemini 2.5 Flash Vision & Offline Fallback
   */
  async analyzeFoodImage(imageBase64: string): Promise<RecognitionResponse> {
    const geminiApiKey = (process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim();

    // 1. Direct Gemini Vision call if API key is provided and mock mode is not forced
    if (geminiApiKey && !isMockEnabled()) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

        const promptText = `Sen uzman bir diyetisyen ve besin analizi yapay zekâsısın. Bu fotoğraftaki yemeği ve tabağı dikkatle incele.
Aşağıdaki JSON şemasına BİREBİR uyacak şekilde YALNIZCA geçerli bir JSON nesnesi döndür:
{
  "timestamp": "${new Date().toISOString()}",
  "detectedFoods": [
    {
      "id": "f-1",
      "foodName": "Yemek Adı (Türkçe)",
      "portionGrams": 150,
      "confidenceScore": 0.95,
      "nutrition": {
        "calories": 250,
        "proteinGrams": 20.0,
        "carbsGrams": 15.0,
        "fatGrams": 8.0,
        "fiberGrams": 3.0,
        "sugarGrams": 2.0,
        "sodiumMg": 300
      }
    }
  ],
  "totalNutrition": {
    "calories": 250,
    "proteinGrams": 20.0,
    "carbsGrams": 15.0,
    "fatGrams": 8.0,
    "fiberGrams": 3.0,
    "sugarGrams": 2.0,
    "sodiumMg": 300
  },
  "disclaimer": "Porsiyon ve kalori tahminleri yapay zekâ modelince yapılmıştır; tıbbi tanı veya reçete yerine geçmez."
}
Hiçbir markdown etiketi (\`\`\`json) ekleme, sadece saf JSON döndür.`;

        const requestBody = {
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            response_mime_type: 'application/json',
          },
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (res.ok) {
          const json = await res.json();
          const textOutput = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textOutput) {
            const parsed: RecognitionResponse = JSON.parse(textOutput);
            if (parsed && parsed.detectedFoods && parsed.detectedFoods.length > 0) {
              return parsed;
            }
          }
        }
      } catch (geminiErr) {
        console.warn('Direct Gemini Vision failed, attempting backend or fallback:', geminiErr);
      }
    }

    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 1200));
      return MOCK_RECOGNITION;
    }

    try {
      const baseUrl = resolveApiBaseUrl();
      const headers = await buildRequestHeaders();
      const response = await fetchWithTimeout(
        `${baseUrl}/nutrition/analyze-photo`,
        {
          method: 'POST',
          headers,
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
   * Send message to the dietary assistant chatbot with medical guardrail and client context
   * Communicates with backend POST /chat/message without exposing any AI API keys on the client
   */
  async sendChatMessage(
    messageText: string,
    context?: UserDietContext
  ): Promise<ChatMessage> {
    const medicalTriggered = isMedicalQuery(messageText);

    if (isMockEnabled()) {
      await new Promise((r) => setTimeout(r, 650));
      if (medicalTriggered) {
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          content:
            'Sağlığınız her şeyden önemlidir. DietAI genel beslenme ve kalori rehberliği sunar; tıbbi tanı koyamaz ve ilaç tedavisi öneremez. Lütfen bu durumu mutlaka hekiminize veya uzman bir klinik diyetisyene danışınız.',
          timestamp: new Date().toISOString(),
          isMedicalWarning: true,
          safety_flag_triggered: true,
        };
      }
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: generateContextualMockDietitianReply(messageText, context),
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const baseUrl = resolveApiBaseUrl();
      const headers = await buildRequestHeaders();
      const response = await fetchWithTimeout(
        `${baseUrl}/chat/message`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ message: messageText, context }),
        },
        8000
      );

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }
      const data: ChatMessage = await response.json();
      const isWarning = Boolean(
        data.isMedicalWarning || data.safety_flag_triggered || medicalTriggered
      );
      return {
        ...data,
        isMedicalWarning: isWarning,
        safety_flag_triggered: isWarning,
      };
    } catch (err) {
      console.warn('Chat API failed, falling back to offline context-aware response:', err);
      if (medicalTriggered) {
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          content:
            'Sağlığınız her şeyden önemlidir. DietAI genel beslenme ve kalori rehberliği sunar; tıbbi tanı koyamaz ve ilaç tedavisi öneremez. Lütfen bu durumu mutlaka hekiminize veya uzman bir klinik diyetisyene danışınız.',
          timestamp: new Date().toISOString(),
          isMedicalWarning: true,
          safety_flag_triggered: true,
        };
      }
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: generateContextualMockDietitianReply(messageText, context),
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
        const baseUrl = resolveApiBaseUrl();
        const headers = await buildRequestHeaders();
        const response = await fetchWithTimeout(
          `${baseUrl}/nutrition/meal-plan`,
          {
            method: 'GET',
            headers,
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
    const fallback = computeClinicalFallback(payload);

    if (!isMockEnabled()) {
      try {
        const baseUrl = resolveApiBaseUrl();
        const headers = await buildRequestHeaders();
        const response = await fetchWithTimeout(
          `${baseUrl}/nutrition/calculate-bmr`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          },
          6000
        );

        if (response.ok) {
          const backendData = await response.json();
          return {
            ...fallback,
            ...backendData,
            bmi: backendData.bmi ?? fallback.bmi,
            bmr_formula_used: backendData.bmr_formula_used ?? fallback.bmr_formula_used,
            ideal_weight_kg: backendData.ideal_weight_kg ?? fallback.ideal_weight_kg,
            ideal_bmi_for_age: backendData.ideal_bmi_for_age ?? fallback.ideal_bmi_for_age,
            ideal_bmr: backendData.ideal_bmr ?? fallback.ideal_bmr,
            ideal_tdee: backendData.ideal_tdee ?? fallback.ideal_tdee,
            calculation_basis: backendData.calculation_basis ?? fallback.calculation_basis,
          };
        }
      } catch (err) {
        console.warn('Backend calculate-bmr API unavailable, using clinical engine fallback:', err);
      }
    }

    return fallback;
  },
};

export function computeClinicalFallback(payload: BMRCalculationRequest): BMRCalculationResponse {
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
}

/**
 * Deterministic offline dietary assistant responder with client context awareness
 */
export function generateContextualMockDietitianReply(
  userPrompt: string,
  context?: UserDietContext
): string {
  const query = userPrompt.toLowerCase();

  const remainingCals = context?.remainingCalories ?? 500;
  const targetCals = context?.targetCalories ?? 2000;
  const consumedCals = context?.consumedCalories ?? 1500;
  const proteinTarget = context?.targetProtein ?? 130;
  const consumedProtein = context?.consumedProtein ?? 75;
  const waterIntake = context?.waterIntakeMl ?? 1250;
  const waterGoal = context?.waterGoalMl ?? 2500;
  const goalStr =
    context?.goal === 'weight_loss'
      ? 'kilo verme / yağ yakımı'
      : context?.goal === 'muscle_gain'
      ? 'kas kazanımı'
      : 'sağlıklı kilo koruma';

  if (query.includes('protein')) {
    const remainingProtein = Math.max(0, proteinTarget - consumedProtein);
    return `Günlük protein hedefiniz **${proteinTarget}g**; şu ana kadar **${consumedProtein}g** tükettiniz. Kalan **${remainingProtein}g** proteini tamamlamak için:\n\n• **Izgara Somon / Tavuk Göğsü** (150g ~ 35g protein)\n• **Lor Peynirli Omlet** (2 yumurta + 50g lor ~ 22g protein)\n• **Süzme Yoğurt & Kinoa Kasesi** (~ 15g protein)\n\nÖğünlerinize ekleyerek hedefinizi rahatça yakalayabilirsiniz! 🍗🥚`;
  }

  if (query.includes('su') || query.includes('hidrasyon')) {
    const remainingWater = Math.max(0, waterGoal - waterIntake);
    return `Harika bir konu! Günlük su hedefiniz **${waterGoal} ml**, şu ana kadar kaydedilen miktar: **${waterIntake} ml**.\n\nHedefe ulaşmak için yaklaşık **${remainingWater} ml** daha su içmeniz metabolizma hızınızı ve tokluk kontrolünüzü destekleyecektir. Küçük yudumlarla gün içine yaymayı unutmayın! 💧`;
  }

  if (
    query.includes('kalori') ||
    query.includes('kilo') ||
    query.includes('bmr') ||
    query.includes('hedef')
  ) {
    return `Mevcut beslenme profiliniz:\n\n• **Günlük Hedef:** ${targetCals} kcal (${goalStr})\n• **Tüketilen:** ${consumedCals} kcal\n• **Kalan Kalori Hakkı:** ${remainingCals} kcal\n• **BMR (Bazal Metabolizma):** ${context?.bmr ?? 1750} kcal\n\nKalan bütçenizi lifli sebzeler ve kaliteli proteinlerle dengeli şekilde kullanabilirsiniz! 🔥`;
  }

  if (query.includes('akşam') || query.includes('gece')) {
    return `Akşam saatlerinde sindirimi kolay, glisemik indeksi düşük alternatifler uyku kalitenizi ve gece yağ yakımını destekler.\n\nKalan **${remainingCals} kcal** bütçeniz için önerilerim:\n• **Buharda Brokoli & Fırın Somon** (Hafif ve omega-3 zengini)\n• **Zeytinyağlı Enginar veya Taze Fasulye** eşliğinde cacık\n• **Izgara Hindi Göğsü ve Roka Salatası** 🥗🐟`;
  }

  if (query.includes('kahvaltı') || query.includes('sabah')) {
    return `Güne kan şekerini dengede tutan protein ağırlıklı bir kahvaltıyla başlamak gün boyu gereksiz atıştırma isteklerini sıfırlar.\n\nÖrnek dengeli tabak:\n• 2 adet haşlanmış veya çırpılmış yumurta 🍳\n• Çeyrek avokado ve bol dereotu/maydanoz\n• 30g lor veya sepet peyniri\n• İsteğe bağlı 1 dilim tam buğday ekmeği! 🥑`;
  }

  if (
    query.includes('tatlı') ||
    query.includes('şeker') ||
    query.includes('kriz') ||
    query.includes('ara öğün')
  ) {
    return `Tatlı veya atıştırmalık krizlerinde kalori dengenizi bozmadan keyif alabileceğiniz temiz alternatifler:\n\n• **Tarçınlı Yeşil Elma Dilimleri:** Tarçın kan şekerini anında dengeler 🍏\n• **1-2 Kare Bitter Çikolata (%80+)** ve 5-6 adet çiğ badem 🍫\n• **Kakaolu Chia Puding:** Yoğurt veya badem sütüyle hazırlanmış hafif ara öğün! ✨`;
  }

  if (query.includes('kahve') || query.includes('kafein')) {
    return `Filtre kahve veya sade Türk kahvesi neredeyse 0 kaloridir ve metabolizma hızını geçici olarak %3-5 artırabilir. Ancak şuruplu veya kremalı kahveler farkında olmadan 250-400 kcal ekleyebilir. Sade veya az yağlı sütle tercih etmek en idealidir! ☕`;
  }

  return `Beslenme ve makro hedeflerinizi titizlikle takip ediyorum! Günlük ${targetCals} kcal bütçenizde kalan **${remainingCals} kcal** hakkınızı temiz gıdalarla değerlendirebilirsiniz. Öğün fikirleri, besin kalori değerleri veya alternatif tarifler için dilediğinizi sorabilirsiniz. 🥑✨`;
}
