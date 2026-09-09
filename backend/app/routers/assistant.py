from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models import Service, Department
from app.schemas.assistant import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    SuggestedService
)

router = APIRouter(prefix="/assistant", tags=["Smart Service Assistant"])

# Keyword dictionary mapping intent terms to search patterns
INTENT_KEYWORDS = {
    "income": ["income", "उत्पन्न", "tahsildar", "salary", "scholarship", "fees"],
    "domicile": ["domicile", "अधिवास", "residence", "15 years", "mpsc", "college", "nationality"],
    "birth": ["birth", "जन्म", "hospital", "child", "discharge", "municipal"],
    "water": ["water", "पाणी", "connection", "nal", "plumbing", "pipe", "tap"],
    "land": ["land", "7/12", "satbara", "जमीन", "mutation", "ferfar"],
    "ration": ["ration", "धान्य", "food", "annapurna"]
}

@router.post("/chat", response_model=AssistantQueryResponse)
def query_assistant(data: AssistantQueryRequest, db: Session = Depends(get_db)):
    query_text = data.query.lower().strip()
    is_marathi = data.language == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in query_text)

    # 1. Identify matching intent keywords
    matched_services = []
    matched_service_ids = set()

    for intent, terms in INTENT_KEYWORDS.items():
        if any(term in query_text for term in terms):
            # Query services matching this intent
            svcs = db.query(Service).filter(
                Service.is_active == True,
                or_(
                    Service.name.ilike(f"%{intent}%"),
                    Service.description.ilike(f"%{intent}%"),
                    Service.code.ilike(f"%{intent}%")
                )
            ).all()

            for s in svcs:
                if s.id not in matched_service_ids:
                    matched_service_ids.add(s.id)
                    matched_services.append(SuggestedService(
                        id=s.id,
                        name=s.name,
                        name_mr=s.name_mr,
                        department_name=s.department.name if s.department else "Government Department",
                        description=s.description,
                        fee=s.fee,
                        processing_days=s.processing_days
                    ))

    # If no specific intent matched, do a general text search
    if not matched_services:
        general_matches = db.query(Service).filter(
            Service.is_active == True,
            or_(
                Service.name.ilike(f"%{query_text}%"),
                Service.description.ilike(f"%{query_text}%")
            )
        ).limit(3).all()

        for s in general_matches:
            matched_services.append(SuggestedService(
                id=s.id,
                name=s.name,
                name_mr=s.name_mr,
                department_name=s.department.name if s.department else "Government Department",
                description=s.description,
                fee=s.fee,
                processing_days=s.processing_days
            ))

    # Formulate verified response
    if matched_services:
        first_svc = matched_services[0]
        if is_marathi:
            resp_msg = (
                f"तुमच्या चौकशीनुसार, '{first_svc.name_mr or first_svc.name}' ही सेवा उपलब्ध आहे. "
                f"हा अर्ज {first_svc.department_name} अंतर्गत येतो आणि अंदाजे {first_svc.processing_days} दिवसांत पूर्ण होतो. "
                f"अधिक माहितीसाठी खालील सेवेवर क्लिक करा."
            )
        else:
            resp_msg = (
                f"Based on your query, the most appropriate service is '{first_svc.name}'. "
                f"This service is administered by the {first_svc.department_name} with an estimated processing time of {first_svc.processing_days} days. "
                f"You can review required documents and apply directly below."
            )
    else:
        if is_marathi:
            resp_msg = (
                "क्षमस्व, तुमच्या चौकशीशी जुळणारी नेमकी सेवा सापडली नाही. "
                "कृपया 'उत्पन्नाचा दाखला', 'जन्म नोंदणी दाखला' किंवा 'नवीन नळ जोडणी' यासारख्या मुख्य शब्दांसह शोधून पहा."
            )
        else:
            resp_msg = (
                "I could not locate an exact match for your specific query in the current service catalog. "
                "Try searching for keywords such as 'Income Certificate', 'Birth Certificate', 'Domicile', or 'Water Connection'."
            )

    return AssistantQueryResponse(
        response=resp_msg,
        suggested_services=matched_services
    )
