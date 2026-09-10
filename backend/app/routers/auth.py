from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    RoleEnum
)
from app.models import User, Citizen, Role
from app.schemas.auth import RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    if data.phone:
        existing_phone = db.query(User).filter(User.phone == data.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this phone number already exists."
            )

    hashed_password = get_password_hash(data.password)

    # Determine assigned role, department, and state
    req_role = (data.role or "CITIZEN").upper().strip()
    if req_role in ["SUPER_ADMIN", "ADMIN"]:
        assigned_role = RoleEnum.SUPER_ADMIN
        assigned_dept_id = None
        assigned_state = (data.state_code or "ALL").upper().strip()
    elif req_role in ["OFFICER", "DEPARTMENT_ADMIN", "DEPT_ADMIN"]:
        assigned_role = RoleEnum.OFFICER
        assigned_dept_id = data.department_id
        assigned_state = (data.state_code or "MH").upper().strip()
    else:
        assigned_role = RoleEnum.CITIZEN
        assigned_dept_id = None
        assigned_state = (data.state_code or "MH").upper().strip()

    user = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        password_hash=hashed_password,
        role=assigned_role,
        department_id=assigned_dept_id,
        state_code=assigned_state,
        is_active=True
    )
    db.add(user)
    
    # Also save to legacy citizens table if citizen role
    if assigned_role == RoleEnum.CITIZEN:
        citizen = Citizen(
            full_name=data.full_name,
            email=data.email,
            phone=data.phone,
            password_hash=hashed_password
        )
        db.add(citizen)
    
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "department_id": user.department_id,
        "state_code": user.state_code or "MH"
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        department_id=user.department_id,
        state_code=user.state_code or "MH"
    )


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently disabled. Contact administrative support."
        )

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "department_id": user.department_id,
        "state_code": user.state_code or "MH"
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        department_id=user.department_id,
        state_code=user.state_code or "MH"
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
