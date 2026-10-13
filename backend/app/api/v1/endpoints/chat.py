from fastapi import APIRouter
from datetime import datetime
import uuid
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter()

# Forbidden medical diagnostic keywords
MEDICAL_RESTRICTIONS = [
    "kansersiniz", "teşhis", "reçete", "antibiyotik", "ilaç", "hastalık tedavisi",
    "diyabet teşhisi", "guatr", "kanser tedavisi"
]

@router.post("/message", response_model=ChatResponse, tags=["Chat"])
async def send_chat_message(payload: ChatRequest):
    """
    Dietary guidance chat with built-in ethical & legal guardrails preventing medical diagnoses.
    """
    user_text = payload.message.lower()

    # Rule-based guardrail check
    for word in MEDICAL_RESTRICTIONS:
        if word in user_text:
            return ChatResponse(
                id=str(uuid.uuid4()),
                content=(
                    "Önemli Uyarı: DietAI yalnızca genel beslenme ve kalori takip danışmanlığı sağlar; "
                    "tıbbi teşhis, hastalık tedavisi veya reçete tavsiyesi veremez. "
                    "Lütfen bu belirtiler için bir tıp hekimine veya kayıtlı bir diyetisyene danışınız."
                ),
                timestamp=datetime.utcnow().isoformat(),
                safety_flag_triggered=True
            )

    return ChatResponse(
        id=str(uuid.uuid4()),
        content=(
            f"Günlük hedefleriniz doğrultusunda '{payload.message}' ile ilgili porsiyon kontrolüne "
            "dikkat etmeniz ve yeterli su tüketmeniz önerilir. Sağlıklı beslenme rutininizi sürdürmenizde başarılar!"
        ),
        timestamp=datetime.utcnow().isoformat(),
        safety_flag_triggered=False
    )
