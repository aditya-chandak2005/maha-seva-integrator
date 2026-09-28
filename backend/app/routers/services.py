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
    service_type: Optional[str] = Query(None, description="Filter by service type: DOCUMENT or SCHEME"),
    scheme_type: Optional[str] = Query(None, description="Filter by scheme domain: AGRICULTURE, EDUCATION_SCHOLARSHIP, INDUSTRIAL_MSME, SOCIAL_WELFARE"),
    db: Session = Depends(get_db)
):
    query = db.query(Service).filter(Service.is_active == True)

    if state_code:
        query = query.filter(Service.state_code == state_code.upper())

    if department_id:
        query = query.filter(Service.department_id == department_id)

    if category_id:
        query = query.filter(Service.category_id == category_id)

    if service_type:
        query = query.filter(Service.service_type == service_type.upper().strip())

    if scheme_type:
        query = query.filter(Service.scheme_type == scheme_type.upper().strip())

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
            service_type=getattr(s, "service_type", "DOCUMENT") or "DOCUMENT",
            scheme_type=getattr(s, "scheme_type", None),
            benefit_amount=getattr(s, "benefit_amount", None),
            sponsor_type=getattr(s, "sponsor_type", "STATE") or "STATE",
            is_active=s.is_active
        ))
    return result

def normalize_doc_requirements(raw_docs) -> List[dict]:
    if not raw_docs:
        return []
    if isinstance(raw_docs, str):
        import json
        try:
            raw_docs = json.loads(raw_docs)
        except Exception:
            raw_docs = [raw_docs]
    if not isinstance(raw_docs, list):
        raw_docs = [raw_docs]

    normalized = []
    for i, doc in enumerate(raw_docs):
        if isinstance(doc, str):
            doc_name = doc.strip()
            name_lower = doc_name.lower()
            if "aadhaar" in name_lower or "aadhar" in name_lower:
                doc_type = "AADHAAR"
            elif "pan" in name_lower:
                doc_type = "PAN"
            elif "7/12" in name_lower or "satbara" in name_lower or "land" in name_lower or "ror" in name_lower:
                doc_type = "LAND_RECORD"
            elif "income" in name_lower:
                doc_type = "INCOME_CERT"
            elif "domicile" in name_lower or "residence" in name_lower or "resident" in name_lower:
                doc_type = "DOMICILE_CERT"
            elif "marksheet" in name_lower or "passing" in name_lower or "degree" in name_lower or "board" in name_lower:
                doc_type = "MARKSHEET"
            elif "bank" in name_lower or "passbook" in name_lower:
                doc_type = "BANK_PASSBOOK"
            elif "ration" in name_lower:
                doc_type = "RATION_CARD"
            elif "caste" in name_lower:
                doc_type = "CASTE_CERT"
            else:
                clean = "".join(c if c.isalnum() else "_" for c in doc_name).strip("_").upper()
                doc_type = f"DOC_{i+1}_{clean[:16]}"

            normalized.append({
                "type": doc_type,
                "name": doc_name,
                "mandatory": True
            })
        elif isinstance(doc, dict):
            name = doc.get("name") or doc.get("title") or doc.get("label") or f"Document {i+1}"
            doc_type = doc.get("type") or doc.get("key") or f"DOC_{i+1}"
            mandatory = doc.get("mandatory", True)
            normalized.append({
                "type": str(doc_type),
                "name": str(name),
                "mandatory": bool(mandatory)
            })
        else:
            normalized.append({
                "type": f"DOC_{i+1}",
                "name": str(doc),
                "mandatory": True
            })
    return normalized

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
        documents_required=normalize_doc_requirements(s.documents_required),
        fee=s.fee,
        processing_days=s.processing_days,
        workflow_id=s.workflow_id,
        integration_type=s.integration_type,
        service_type=getattr(s, "service_type", "DOCUMENT") or "DOCUMENT",
        scheme_type=getattr(s, "scheme_type", None),
        benefit_amount=getattr(s, "benefit_amount", None),
        sponsor_type=getattr(s, "sponsor_type", "STATE") or "STATE",
        is_active=s.is_active,
        form_schema=form_schema
    )
