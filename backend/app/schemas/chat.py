from pydantic import BaseModel, Field
from typing import Optional

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    user_context: Optional[dict] = None

class ChatResponse(BaseModel):
    id: str
    sender: str = "assistant"
    content: str
    timestamp: str
    safety_flag_triggered: bool = False
