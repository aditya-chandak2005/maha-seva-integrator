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
from app.models import User, Citizen, Role, Department
from app.schemas.auth import RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        if data.email in [
            "admin.mh@mahaseva.gov.in", "admin.ka@mahaseva.gov.in", "admin.dl@mahaseva.gov.in",
            "admin.up@mahaseva.gov.in", "admin.central@mahaseva.gov.in", "admin@mahaseva.gov.in",
            "officer.revenue@mahaseva.gov.in", "officer.municipal@mahaseva.gov.in",
            "officer.bescom@mahaseva.gov.in", "officer.delhi@mahaseva.gov.in", "officer.cbse@mahaseva.gov.in"
        ]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with email '{data.email}' already exists. This is a pre-configured official account — please click 'Sign in to Portal' to login directly with password 'Admin@2026' or 'Officer@2026', or use your personalized name (e.g. yourname.{data.state_code.lower() if data.state_code else 'mh'}@mahaseva.gov.in) to register a new administrator."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{data.email}' already exists. Please choose a unique email or sign in directly."
        )

    if data.phone:
        existing_phone = db.query(User).filter(User.phone == data.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this phone number already exists."
            )

    hashed_password = get_password_hash(data.password)

    email_clean = data.email.lower().strip()

    # Determine assigned role, department, and state
    req_role = (data.role or "CITIZEN").upper().strip()
    if req_role in ["SUPER_ADMIN", "ADMIN"]:
        assigned_role = RoleEnum.SUPER_ADMIN
        assigned_dept_id = None
        assigned_state = (data.state_code or "ALL").upper().strip()

        # Enforce state initials in Administrator email
        if assigned_state != "ALL":
            state_lower = assigned_state.lower()
            if state_lower not in email_clean and f".{state_lower}" not in email_clean:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"State Administrator email must contain state initials '{state_lower}' (e.g. admin.{state_lower}@mahaseva.gov.in or <name>.{state_lower}@mahaseva.gov.in)."
                )

    elif req_role in ["OFFICER", "DEPARTMENT_ADMIN", "DEPT_ADMIN"]:
        assigned_role = RoleEnum.OFFICER
        assigned_dept_id = data.department_id
        assigned_state = (data.state_code or "MH").upper().strip()

        if not assigned_dept_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Departmental officers must select their assigned government department."
            )

        dept = db.query(Department).filter(Department.id == assigned_dept_id).first()
        clean_dept = ""
        if dept:
            dept_code_lower = dept.code.lower()
            clean_dept = dept_code_lower.split("_")[-1] if "_" in dept_code_lower else dept_code_lower

        # Enforce departmental format: must contain 'officer', or dept code/name, or .gov.in
        valid_dept = (
            "officer" in email_clean or
            (clean_dept and clean_dept in email_clean) or
            "dept" in email_clean or
            "revenue" in email_clean or
            "cbse" in email_clean or
            "municipal" in email_clean or
            "bescom" in email_clean or
            "gov.in" in email_clean
        )
        if not valid_dept:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Departmental email must follow official departmental format (e.g. officer.{clean_dept or 'dept'}@mahaseva.gov.in or <name>.{clean_dept or 'dept'}@mahaseva.gov.in)."
            )

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
