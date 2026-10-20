import { RecognitionResponse, ChatMessage, MealPlanDay } from '../types';
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
};
