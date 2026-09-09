from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models import Service, ServiceCategory, ServiceForm, Department
from app.schemas.services import (
    ServiceListItem,
    ServiceDetailResponse,
    ServiceCategoryResponse
)

router = APIRouter(prefix="/services", tags=["Services"])

@router.get("/categories", response_model=List[ServiceCategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return db.query(ServiceCategory).all()

@router.get("", response_model=List[ServiceListItem])
def list_services(
    q: Optional[str] = Query(None, description="Search keyword for service title or description"),
    state_code: Optional[str] = Query(None, description="Filter by state code (e.g. MH, KA, GJ, DL, UP)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Service).filter(Service.is_active == True)

    if state_code:
        query = query.filter(Service.state_code == state_code.upper())

    if department_id:
        query = query.filter(Service.department_id == department_id)

    if category_id:
        query = query.filter(Service.category_id == category_id)

    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Service.name.ilike(search_pattern),
                Service.name_mr.ilike(search_pattern),
                Service.name_hi.ilike(search_pattern),
                Service.description.ilike(search_pattern),
                Service.description_hi.ilike(search_pattern),
                Service.code.ilike(search_pattern)
            )
        )

    services = query.all()
    result = []
    for s in services:
        result.append(ServiceListItem(
            id=s.id,
            code=s.code,
            state_code=s.state_code or "MH",
            name=s.name,
            name_mr=s.name_mr,
            name_hi=s.name_hi,
            department_id=s.department_id,
            department_name=s.department.name if s.department else None,
            category_id=s.category_id,
            category_name=s.category.name if s.category else None,
            description=s.description,
            description_hi=s.description_hi,
            fee=s.fee,
            processing_days=s.processing_days,
            integration_type=s.integration_type,
            is_active=s.is_active
        ))
    return result

@router.get("/{service_id}", response_model=ServiceDetailResponse)
def get_service_detail(service_id: int, db: Session = Depends(get_db)):
    s = db.query(Service).filter(Service.id == service_id, Service.is_active == True).first()
    if not s:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )

    form_schema = []
    if s.form and s.form.form_schema:
        if isinstance(s.form.form_schema, dict) and "fields" in s.form.form_schema:
            form_schema = s.form.form_schema["fields"]
        elif isinstance(s.form.form_schema, list):
            form_schema = s.form.form_schema
        else:
            form_schema = s.form.form_schema

    return ServiceDetailResponse(
        id=s.id,
        code=s.code,
        state_code=s.state_code or "MH",
        name=s.name,
        name_mr=s.name_mr,
        name_hi=s.name_hi,
        department_id=s.department_id,
        department_name=s.department.name if s.department else None,
        category_id=s.category_id,
        category_name=s.category.name if s.category else None,
        description=s.description,
        description_mr=s.description_mr,
        description_hi=s.description_hi,
        eligibility=s.eligibility,
        documents_required=s.documents_required or [],
        fee=s.fee,
        processing_days=s.processing_days,
        workflow_id=s.workflow_id,
        integration_type=s.integration_type,
        is_active=s.is_active,
        form_schema=form_schema
    )
