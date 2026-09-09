from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str

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

class UserResponse(BaseModel):
    id: int
    email: str
    phone: Optional[str] = None
    full_name: str
    role: str
    department_id: Optional[int] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
