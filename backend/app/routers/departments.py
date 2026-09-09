from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Department, Service
from app.schemas.departments import DepartmentResponse
from app.schemas.services import ServiceListItem

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).filter(Department.is_active == True).order_by(Department.id.asc()).all()

@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(department_id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == department_id, Department.is_active == True).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    return dept

@router.get("/{department_id}/services", response_model=List[ServiceListItem])
def get_department_services(department_id: int, db: Session = Depends(get_db)):
    services = db.query(Service).filter(
        Service.department_id == department_id,
        Service.is_active == True
    ).all()
    
    result = []
    for s in services:
        result.append(ServiceListItem(
            id=s.id,
            code=s.code,
            name=s.name,
            name_mr=s.name_mr,
            department_id=s.department_id,
            department_name=s.department.name if s.department else None,
            category_id=s.category_id,
            category_name=s.category.name if s.category else None,
            description=s.description,
            fee=s.fee,
            processing_days=s.processing_days,
            integration_type=s.integration_type,
            is_active=s.is_active
        ))
    return result
