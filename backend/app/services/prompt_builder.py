"""
Builds what the backend sends to the local AI service for a chat message.

The backend OWNS the system prompt and the context. The AI service does not need
to know anything about our databases: it receives a ready-to-use `system_prompt`
and an OpenAI/Ollama-style `messages` list and just runs the local model.

See "AI Service Contract" in backend/README.md for the full JSON.
"""

from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.services.chat_history import ChatTurn
from app.services.guardrails import GuardrailVerdict

BASE_SYSTEM_PROMPT = """Sen "DietAI" adında, bilimsel ve sağlıklı beslenme rehberliği sunan bir yapay zekâ beslenme asistanısın.

GÖREVLERİN:
1. Dengeli makro besin alımı, porsiyon kontrolü, hidrasyon ve sağlıklı yemek alternatifleri hakkında bilgi vermek.
2. Aşağıdaki KULLANICI PROFİLİ ve BUGÜNKÜ DURUM bilgilerini kullanarak kişiselleştirilmiş, motive edici ve uygulanabilir öneriler sunmak.
3. Önceki mesajları (sohbet geçmişi) hatırlayarak tutarlı cevaplar vermek.

KESİN ETİK VE YASAL KURALLAR:
- ASLA tıbbi teşhis koyma (diyabet, böbrek yetmezliği, kanser, tiroid vb.).
- ASLA reçeteli/reçetesiz ilaç, doz veya takviye tedavisi önerme.
- ASLA günlük {calorie_floor} kcal altında beslenme veya sağlığı riske atan şok diyet önerme.
- Kullanıcı bir hastalık, tıbbi semptom veya tahlil sonucu sorarsa kibarca bir hekime veya klinik diyetisyene yönlendir.

CEVAP STİLİ:
- Türkçe, samimi ve kısa cevap ver (en fazla birkaç paragraf veya madde listesi).
- Sayısal hedeflerden bahsederken aşağıdaki bağlamdaki değerleri kullan, uydurma.
- Bağlamda olmayan bir bilgi gerekiyorsa tahmin etme, kullanıcıya sor."""

SENSITIVE_TOPIC_INSTRUCTION = """
EK GÜVENLİK TALİMATI (bu mesaj için):
Kullanıcının mesajı tıbbi bir konuya değiniyor ({keywords}). Yalnızca genel beslenme bilgisi ver,
teşhis/tedavi/ilaç önerisi yapma ve cevabının sonunda mutlaka bir hekime veya klinik diyetisyene
danışmasını öner."""

GOAL_LABELS = {
    "weight_loss": "Kilo verme",
    "muscle_gain": "Kas kazanımı",
    "maintenance": "Kilo koruma",
}

GENDER_LABELS = {"male": "Erkek", "female": "Kadın"}

ACTIVITY_LABELS = {
    "sedentary": "Hareketsiz",
    "light": "Az hareketli",
    "moderate": "Orta hareketli",
    "active": "Çok hareketli",
    "very_active": "Aşırı hareketli",
}


def _fmt(value: Any, unit: str = "") -> str:
    if isinstance(value, float):
        value = round(value, 1)
        if value == int(value):
            value = int(value)
    return f"{value}{(' ' + unit) if unit else ''}"


def _render_profile(profile: Optional[Dict[str, Any]]) -> str:
    if not profile:
        return "KULLANICI PROFİLİ: Bilinmiyor (misafir kullanıcı veya profil oluşturulmamış)."

    lines = ["KULLANICI PROFİLİ (veritabanından):"]
    if profile.get("full_name"):
        lines.append(f"- İsim: {profile['full_name']}")
    lines.append(f"- Cinsiyet: {GENDER_LABELS.get(profile.get('gender'), profile.get('gender'))}")
    lines.append(f"- Yaş: {profile.get('age')}")
    lines.append(f"- Boy: {_fmt(profile.get('height_cm'), 'cm')}, Kilo: {_fmt(profile.get('weight_kg'), 'kg')}")
    lines.append(f"- BKİ (BMI): {_fmt(profile.get('bmi'))}")
    lines.append(f"- İdeal kilo: {_fmt(profile.get('ideal_weight_kg'), 'kg')}")
    lines.append(f"- Hedef: {GOAL_LABELS.get(profile.get('goal'), profile.get('goal'))}")
    activity = ACTIVITY_LABELS.get(profile.get("activity_level"), profile.get("activity_level"))
    if profile.get("does_sports"):
        lines.append(f"- Aktivite: {activity} (haftada {profile.get('sports_days_per_week')} gün spor)")
    else:
        lines.append(f"- Aktivite: {activity}")
    lines.append(f"- BMR: {_fmt(profile.get('bmr'), 'kcal')}, TDEE: {_fmt(profile.get('tdee'), 'kcal')}")
    lines.append(
        f"- Günlük hedef: {_fmt(profile.get('target_calories'), 'kcal')} | "
        f"Protein {_fmt(profile.get('recommended_protein_g'), 'g')}, "
        f"Karbonhidrat {_fmt(profile.get('recommended_carbs_g'), 'g')}, "
        f"Yağ {_fmt(profile.get('recommended_fat_g'), 'g')}"
    )

    conditions = [
        label
        for key, label in (
            ("has_diabetes", "Diyabet / insülin direnci"),
            ("has_cholesterol", "Yüksek kolesterol"),
            ("has_hypertension", "Hipertansiyon"),
        )
        if profile.get(key)
    ]
    if conditions:
        lines.append(
            f"- Kullanıcının beyan ettiği durumlar: {', '.join(conditions)} "
            "(öneriler buna uygun olmalı, ama tedavi önerme)"
        )
    return "\n".join(lines)


def _render_diet_today(diet: Optional[Dict[str, Any]]) -> str:
    if not diet:
        return "BUGÜNKÜ DURUM: Uygulamadan bilgi gelmedi."

    def pair(consumed_key: str, target_key: str, unit: str) -> str:
        consumed = diet.get(consumed_key)
        target = diet.get(target_key)
        if consumed is None and target is None:
            return "bilinmiyor"
        return f"{_fmt(consumed if consumed is not None else '?')} / {_fmt(target if target is not None else '?')} {unit}"

    lines = ["BUGÜNKÜ DURUM (mobil uygulamadan, anlık):"]
    lines.append(f"- Kalori (tüketilen / hedef): {pair('consumedCalories', 'targetCalories', 'kcal')}")
    if diet.get("remainingCalories") is not None:
        lines.append(f"- Kalan kalori: {_fmt(diet['remainingCalories'], 'kcal')}")
    lines.append(f"- Protein: {pair('consumedProtein', 'targetProtein', 'g')}")
    lines.append(f"- Karbonhidrat: {pair('consumedCarbs', 'targetCarbs', 'g')}")
    lines.append(f"- Yağ: {pair('consumedFat', 'targetFat', 'g')}")
    lines.append(f"- Su: {pair('waterIntakeMl', 'waterGoalMl', 'ml')}")
    if diet.get("currentWeightKg") is not None:
        weight_line = f"- Güncel kilo: {_fmt(diet['currentWeightKg'], 'kg')}"
        if diet.get("targetWeightKg") is not None:
            weight_line += f", hedef kilo: {_fmt(diet['targetWeightKg'], 'kg')}"
        lines.append(weight_line)
    if diet.get("goal"):
        lines.append(f"- Hedef: {GOAL_LABELS.get(diet['goal'], diet['goal'])}")
    meals = diet.get("recentMealNames") or []
    lines.append(f"- Bugün yenenler: {', '.join(meals) if meals else 'henüz kayıt yok'}")
    return "\n".join(lines)


def _calorie_floor(profile: Optional[Dict[str, Any]]) -> int:
    if profile and profile.get("gender") == "male":
        return 1500
    return 1200


def build_system_prompt(
    profile: Optional[Dict[str, Any]],
    diet_today: Optional[Dict[str, Any]],
    verdict: GuardrailVerdict,
) -> str:
    parts = [
        BASE_SYSTEM_PROMPT.format(calorie_floor=_calorie_floor(profile)),
        _render_profile(profile),
        _render_diet_today(diet_today),
    ]
    if verdict.sensitive:
        parts.append(SENSITIVE_TOPIC_INSTRUCTION.format(keywords=", ".join(verdict.matched_keywords)).strip())
    return "\n\n".join(parts)


def build_messages(history: List[ChatTurn], current_message: str) -> List[Dict[str, str]]:
    """History turns (oldest first) + current message, in OpenAI/Ollama chat format (no system message)."""
    messages: List[Dict[str, str]] = []
    for turn in history:
        messages.append({"role": "user", "content": turn.user_message})
        messages.append({"role": "assistant", "content": turn.assistant_response})
    messages.append({"role": "user", "content": current_message})
    return messages


def build_chat_payload(
    *,
    request_id: str,
    session_id: str,
    user_id: Optional[int],
    message: str,
    history: List[ChatTurn],
    profile: Optional[Dict[str, Any]],
    diet_today: Optional[Dict[str, Any]],
    verdict: GuardrailVerdict,
) -> Dict[str, Any]:
    """The exact JSON body POSTed to `{AI_SERVICE_URL}{AI_CHAT_PATH}`."""
    return {
        "request_id": request_id,
        "session_id": session_id,
        "user_id": user_id,
        "system_prompt": build_system_prompt(profile, diet_today, verdict),
        "messages": build_messages(history, message),
        # Raw data too, in case the AI service wants to use it itself.
        "prompt": message,
        "user_context": {
            "profile": profile,
            "diet_today": diet_today,
        },
        "safety": {
            "sensitive_topic": verdict.sensitive,
            "matched_keywords": list(verdict.matched_keywords),
        },
        "options": {
            "temperature": settings.AI_TEMPERATURE,
            "max_tokens": settings.AI_MAX_TOKENS,
            "language": "tr",
        },
    }
