from typing import List, Optional
from pydantic import BaseModel

class AssistantMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class SuggestedService(BaseModel):
    id: int
    name: str
    name_mr: Optional[str] = None
    department_name: str
    description: Optional[str] = None
    fee: float
    processing_days: int

class AssistantQueryRequest(BaseModel):
    query: str
    language: Optional[str] = "en"  # "en" or "mr"

class AssistantQueryResponse(BaseModel):
    response: str
    suggested_services: List[SuggestedService] = []
