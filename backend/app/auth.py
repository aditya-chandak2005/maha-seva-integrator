import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Citizen

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = os.getenv("JWT_SECRET", "development-secret")
ALGORITHM = "HS256"


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str


@router.post("/register")
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    existing_email = db.query(Citizen).filter(
        Citizen.email == data.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    existing_phone = db.query(Citizen).filter(
        Citizen.phone == data.phone
    ).first()

    if existing_phone:
        raise HTTPException(
            status_code=400,
            detail="Phone number already registered"
        )

    hashed_password = pwd_context.hash(data.password)

    citizen = Citizen(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        password_hash=hashed_password
    )

    db.add(citizen)
    db.commit()
    db.refresh(citizen)

    return {
        "message": "Citizen registered successfully",
        "citizen_id": citizen.id,
        "name": citizen.full_name,
        "email": citizen.email
    }


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    citizen = db.query(Citizen).filter(
        Citizen.email == form_data.username
    ).first()

    if not citizen:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not pwd_context.verify(
        form_data.password,
        citizen.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = jwt.encode(
        {
            "sub": str(citizen.id),
            "email": citizen.email
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "citizen_id": citizen.id,
        "name": citizen.full_name
    }