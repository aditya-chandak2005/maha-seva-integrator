from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: Optional[str] = "CITIZEN"
    state_code: Optional[str] = "MH"
    department_id: Optional[int] = None
    admin_code: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    email: str
    role: str
    department_id: Optional[int] = None
    state_code: Optional[str] = "MH"

class UserResponse(BaseModel):
    id: int
    email: str
    phone: Optional[str] = None
    full_name: str
    role: str
    department_id: Optional[int] = None
    state_code: Optional[str] = "MH"
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
