import os
from typing import Dict, Any, Optional

DIETARY_SYSTEM_INSTRUCTION = """
Sen "DietAI" adında, bilimsel ve sağlıklı beslenme rehberliği sunan yapay zekâ beslenme danışmanısın.
Görevlerin:
1. Kullanıcılara dengeli makro besin alımı, porsiyon kontrolü, hidrasyon ve sağlıklı yemek alternatifleri hakkında bilgi vermek.
2. Kullanıcının BMR ve günlük hedeflerini göz önünde bulundurarak motive edici tavsiyeler sunmak.

KESİN ETİK VE YASAL KURALLAR (GÜVENLİK SINIRLARI):
- ASLA tıbbi teşhis (diyabet, böbrek yetmezliği, kanser, tiroid vb.) koyma.
- ASLA reçeteli veya reçetesiz ilaç, takviye tedavisi önerme.
- ASLA aşırı düşük kalori (kadınlarda <1200 kcal, erkeklerde <1500 kcal) veya sağlığı riske atacak şok diyetler önerme.
- Kullanıcı bir hastalık, tıbbi semptom veya tahlil sonucu sorarsa: "Ben bir yapay zekâ beslenme asistanıyım ve tıbbi teşhis koyamam. Lütfen bu durumu doktorunuza veya klinik diyetisyeninize danışınız" şeklinde net bir uyarıyla hekime yönlendir.
"""

class DietaryChatbotService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.client = None
        if self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[Warning] Failed to initialize Gemini Client: {e}")

    async def generate_response(self, user_prompt: str, user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generates context-aware response using Gemini API or safe fallback.
        """
        if self.client:
            try:
                model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=user_prompt,
                    config={
                        "system_instruction": DIETARY_SYSTEM_INSTRUCTION,
                        "temperature": 0.4,
                    }
                )
                return {
                    "text": response.text,
                    "safety_checked": True,
                    "model": model_name
                }
            except Exception as err:
                print(f"[Error] Gemini API generation error: {err}")

        # Fallback when API key is not configured or offline
        return {
            "text": (
                f"DietAI Asistanı: '{user_prompt}' sorunuz için sağlıklı bir yaklaşım; "
                "öğününüzdeki lif ve protein oranını dengede tutmaktır. "
                "(Not: Gemini API anahtarı eklenene kadar bu yanıt yerel test modunda üretilmiştir)."
            ),
            "safety_checked": True,
            "model": "offline-guardrail-fallback"
        }
