import { RecognitionResponse, ChatMessage, MealPlanDay } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';

// Mock data to enable instant parallel mobile UI development
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
   * Analyze food image from camera/gallery
   */
  async analyzeFoodImage(imageBase64: string): Promise<RecognitionResponse> {
    if (USE_MOCK) {
      // Simulate network latency
      await new Promise((r) => setTimeout(r, 1200));
      return MOCK_RECOGNITION;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/nutrition/analyze-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: imageBase64 }),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn('API call failed, falling back to mock data:', err);
      return MOCK_RECOGNITION;
    }
  },

  /**
   * Send message to the dietary assistant chatbot with medical guardrail
   */
  async sendChatMessage(messageText: string): Promise<ChatMessage> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800));
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: `Günlük makro hedeflerinize göre protein alımınız dengeli görünüyor! "${messageText}" konusuna ilişkin sağlıklı alternatifleri değerlendirebilirsiniz. Unutmayın, bu tavsiyeler genel beslenme rehberliği amaçlıdır.`,
        timestamp: new Date().toISOString(),
      };
    }

    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageText }),
    });
    return await response.json();
  },

  /**
   * Get personalized weekly meal plan
   */
  async getMealPlan(): Promise<MealPlanDay[]> {
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
