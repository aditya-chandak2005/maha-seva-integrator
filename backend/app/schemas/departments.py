from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class DepartmentResponse(BaseModel):
    id: int
    code: str
    name: str
    name_mr: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True
