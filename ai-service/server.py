from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from chatbot.guardrails import DietaryChatbotService
from cv_engine.detector import FoodDetectorEngine

app = FastAPI(
    title="DietAI - AI & CV Service",
    description="Microservice for Computer Vision Food Recognition & Guardrailed LLM Chatbot",
    version="1.0.0"
)

chatbot_service = DietaryChatbotService()
cv_engine = FoodDetectorEngine()

class DetectFoodRequest(BaseModel):
    image_base64: str

class ChatbotRequest(BaseModel):
    prompt: str
    user_context: Optional[Dict[str, Any]] = None

@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}

@app.post("/api/v1/cv/detect")
def detect_food(payload: DetectFoodRequest):
    if not payload.image_base64:
        raise HTTPException(status_code=400, detail="image_base64 is required")
    return cv_engine.analyze_image(payload.image_base64)

@app.post("/api/v1/llm/chat")
async def chat_with_advisor(payload: ChatbotRequest):
    if not payload.prompt:
        raise HTTPException(status_code=400, detail="prompt cannot be empty")
    return await chatbot_service.generate_response(payload.prompt, payload.user_context)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
