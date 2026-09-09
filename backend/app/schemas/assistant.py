from typing import List, Optional
from pydantic import BaseModel

class AssistantMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class SuggestedService(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    name_mr: Optional[str] = None
    name_hi: Optional[str] = None
    state_code: Optional[str] = "MH"
    department_name: str
    description: Optional[str] = None
    fee: float
    processing_days: int

class AssistantQueryRequest(BaseModel):
    query: str
    language: Optional[str] = "en"  # "en", "mr", "hi"
    api_key: Optional[str] = None  # Optional Gemini API key provided by client
    state_code: Optional[str] = None  # Optional state filter e.g. "MH", "KA", "DL", etc.
    history: Optional[List[AssistantMessage]] = []

class AssistantQueryResponse(BaseModel):
    response: str
    suggested_services: List[SuggestedService] = []
    engine: Optional[str] = "local"  # "gemini-2.5-flash" or "local-catalog-intelligence"

class KeyValidationRequest(BaseModel):
    api_key: str

class KeyValidationResponse(BaseModel):
    valid: bool
    model: Optional[str] = None
    message: str
