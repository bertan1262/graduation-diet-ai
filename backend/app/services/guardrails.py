"""
Rule-based medical guardrails (runs in the backend BEFORE the AI service is called).

Two levels:
    BLOCKED    -> diagnosis / prescription / medication requests.
                  The AI service is NOT called; a fixed safety message is returned.
    SENSITIVE  -> the message mentions a medical condition (diabetes, blood pressure ...).
                  The AI service IS called, but the system prompt gets an extra
                  safety instruction and the response is flagged
                  (`safety_flag_triggered = true`) so the app shows the warning style.
                  This list mirrors MEDICAL_GUARDRAIL_KEYWORDS in mobile/src/services/api.ts.

Matching is accent/case-insensitive for Turkish ("İLAÇ", "ilac", "İlaç" all match).
"""

import unicodedata
from dataclasses import dataclass, field
from typing import List

MEDICAL_REFUSAL_MESSAGE = (
    "Önemli Uyarı: DietAI yalnızca genel beslenme ve kalori takibi konusunda rehberlik sağlar; "
    "tıbbi teşhis koyamaz, ilaç veya tedavi öneremez. Lütfen bu konu için bir hekime veya "
    "klinik diyetisyene danışınız."
)

# Requests the assistant must never answer.
BLOCKED_KEYWORDS: List[str] = [
    "teşhis",
    "tanı koy",
    "reçete",
    "ilaç",
    "antibiyotik",
    "insülin dozu",
    "doz ayarla",
    "hastalık tedavisi",
    "kanser tedavisi",
    "diyabet teşhisi",
    "kansersiniz",
    "diagnose",
    "diagnosis",
    "prescription",
    "medication",
    "antibiotic",
]

# Medical topics: allowed, but answered with extra care + warning flag.
SENSITIVE_KEYWORDS: List[str] = [
    "tedavi",
    "hastalık",
    "ağrı",
    "tansiyon",
    "diyabet",
    "kanser",
    "guatr",
    "kolesterol",
    "böbrek",
    "tiroid",
    "hamile",
    "gebelik",
    "emzir",
]


def normalize_tr(text: str) -> str:
    """Lowercases with Turkish rules and strips accents: 'İlaç Tedavisi' -> 'ilac tedavisi'."""
    lowered = text.replace("İ", "i").replace("I", "ı").lower()
    decomposed = unicodedata.normalize("NFD", lowered)
    without_marks = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return without_marks.replace("ı", "i")


_BLOCKED_NORMALIZED = [(kw, normalize_tr(kw)) for kw in BLOCKED_KEYWORDS]
_SENSITIVE_NORMALIZED = [(kw, normalize_tr(kw)) for kw in SENSITIVE_KEYWORDS]


@dataclass
class GuardrailVerdict:
    blocked: bool = False
    sensitive: bool = False
    matched_keywords: List[str] = field(default_factory=list)

    @property
    def flagged(self) -> bool:
        return self.blocked or self.sensitive


def evaluate_message(message: str) -> GuardrailVerdict:
    normalized = normalize_tr(message)

    blocked_hits = [original for original, kw in _BLOCKED_NORMALIZED if kw in normalized]
    if blocked_hits:
        return GuardrailVerdict(blocked=True, sensitive=True, matched_keywords=blocked_hits)

    sensitive_hits = [original for original, kw in _SENSITIVE_NORMALIZED if kw in normalized]
    if sensitive_hits:
        return GuardrailVerdict(blocked=False, sensitive=True, matched_keywords=sensitive_hits)

    return GuardrailVerdict()
