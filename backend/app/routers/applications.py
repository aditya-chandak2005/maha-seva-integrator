import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import (
    User, Application, ApplicationEvent, Service, Department,
    Notification, AuditLog, Document
)
from app.schemas.applications import (
    ApplicationCreateRequest,
    ApplicationListItem,
    ApplicationDetailResponse,
    TimelineEventResponse
)
from app.integrations.orchestrator import orchestrator

router = APIRouter(prefix="/applications", tags=["Applications"])

def generate_application_number(dept_code: str, state_code: str = "MH") -> str:
    clean_dept = dept_code.split("_")[-1] if "_" in dept_code else dept_code
    year = datetime.now().year
    random_digits = random.randint(10000, 99999)
    prefix = (state_code or "MH").upper()
    return f"{prefix}-{clean_dept}-{year}-{random_digits}"

@router.post("", response_model=ApplicationDetailResponse)
def submit_application(
    data: ApplicationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == data.service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specified service does not exist or is inactive"
        )

    # Prevent duplicate active applications for the same service by this citizen
    inactive_statuses = ["REJECTED", "CANCELLED"]
    existing_active = db.query(Application).filter(
        Application.citizen_id == current_user.id,
        Application.service_id == service.id,
        ~Application.status.in_(inactive_statuses)
    ).order_by(Application.submitted_at.desc()).first()

    if existing_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have an active application ({existing_active.application_number}) for '{service.name}' with status '{existing_active.status}'. Duplicate submissions are not permitted."
        )

    dept = db.query(Department).filter(Department.id == service.department_id).first()
    dept_code = dept.code if dept else "GEN"
    state_code = service.state_code or (dept.state_code if dept else "MH")

    app_number = generate_application_number(dept_code, state_code)

    # Invoke Integration Adapter to simulate external department registration
    adapter = orchestrator.get_adapter(service.integration_type)
    external_ack = adapter.submit_application({
        **data.form_data,
        "application_number": app_number,
        "service_code": service.code,
        "citizen_name": current_user.full_name
    })

    application = Application(
        application_number=app_number,
        citizen_id=current_user.id,
        service_id=service.id,
        department_id=service.department_id,
        status="SUBMITTED",
        form_data=data.form_data,
        tracking_data=external_ack,
        remarks="Application successfully accepted by Maha-Seva gateway."
    )
    try:
        db.add(application)
        db.commit()
        db.refresh(application)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An active application for '{service.name}' already exists. Duplicate submissions are not permitted."
        )

    # Attach any pre-existing vault documents to this application
    if data.vault_document_ids:
        for v_id in data.vault_document_ids:
            v_doc = db.query(Document).filter(
                Document.id == v_id,
                Document.citizen_id == current_user.id
            ).first()
            if v_doc:
                app_doc = Document(
                    application_id=application.id,
                    citizen_id=current_user.id,
                    document_type=v_doc.document_type,
                    file_name=v_doc.file_name,
                    original_file_name=v_doc.original_file_name,
                    mime_type=v_doc.mime_type,
                    file_size=v_doc.file_size,
                    storage_path=v_doc.storage_path,
                    file_hash=v_doc.file_hash,
                    verification_status="VERIFIED"
                )
                db.add(app_doc)
        db.commit()

    # Record initial timeline event
    initial_event = ApplicationEvent(
        application_id=application.id,
        old_status=None,
        new_status="SUBMITTED",
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        remarks="Application submitted online via citizen portal."
    )
    db.add(initial_event)

    # Create Citizen In-App Notification
    db.add(Notification(
        user_id=current_user.id,
        application_id=application.id,
        title="Application Submitted Successfully",
        message=f"Your application {app_number} for {service.name} has been submitted. Estimated processing time: {service.processing_days} days.",
        notification_type="APPLICATION_SUBMITTED"
    ))

    # Record Audit Log
    db.add(AuditLog(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="APPLICATION_SUBMITTED",
        entity_type="APPLICATION",
        entity_id=str(application.id),
        details={"application_number": app_number, "service_id": service.id}
    ))

    db.commit()
    db.refresh(application)

    return get_application_detail_response(application)


@router.get("/my", response_model=List[ApplicationListItem])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).filter(
        Application.citizen_id == current_user.id
    ).order_by(Application.submitted_at.desc()).all()

    result = []
    for a in apps:
        result.append(ApplicationListItem(
            id=a.id,
            application_number=a.application_number,
            service_id=a.service_id,
            service_name=a.service.name if a.service else None,
            department_id=a.department_id,
            department_name=a.service.department.name if a.service and a.service.department else None,
            citizen_id=a.citizen_id,
            citizen_name=current_user.full_name,
            status=a.status,
            submitted_at=a.submitted_at,
            updated_at=a.updated_at
        ))
    return result


@router.get("/check-active")
def check_active_application(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inactive_statuses = ["REJECTED", "CANCELLED"]
    existing = db.query(Application).filter(
        Application.citizen_id == current_user.id,
        Application.service_id == service_id,
        ~Application.status.in_(inactive_statuses)
    ).order_by(Application.submitted_at.desc()).first()

    if existing:
        return {
            "has_active": True,
            "application_number": existing.application_number,
            "status": existing.status,
            "submitted_at": existing.submitted_at.isoformat() if existing.submitted_at else None
        }
    return {"has_active": False}


@router.get("/track/{application_number}", response_model=ApplicationDetailResponse)
def track_application_public(application_number: str, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.application_number == application_number.strip()).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_number}' not found. Please verify the application reference number."
        )

    return get_application_detail_response(app)


@router.get("/{application_id}", response_model=ApplicationDetailResponse)
def get_application_detail(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Ensure Citizen can only inspect their own applications
    if current_user.role == "CITIZEN" and app.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You cannot access another citizen's application"
        )

    # Ensure Officer can only inspect applications from their department
    if current_user.role == "OFFICER" and current_user.department_id != app.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You cannot inspect applications outside your assigned department"
        )

    return get_application_detail_response(app)


def get_application_detail_response(app: Application) -> ApplicationDetailResponse:
    timeline_events = [
        TimelineEventResponse(
            id=ev.id,
            old_status=ev.old_status,
            new_status=ev.new_status,
            actor_name=ev.actor_name,
            actor_role=ev.actor_role,
            remarks=ev.remarks,
            created_at=ev.created_at
        ) for ev in app.events
    ]

    docs_list = [
        {
            "id": d.id,
            "document_type": d.document_type,
            "file_name": d.file_name,
            "original_file_name": d.original_file_name,
            "mime_type": d.mime_type,
            "file_size": d.file_size,
            "verification_status": d.verification_status,
            "rejection_reason": d.rejection_reason,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None
        } for d in app.documents
    ]

    return ApplicationDetailResponse(
        id=app.id,
        application_number=app.application_number,
        service_id=app.service_id,
        service_name=app.service.name if app.service else None,
        service_code=app.service.code if app.service else None,
        department_id=app.department_id,
        department_name=app.service.department.name if app.service and app.service.department else None,
        citizen_id=app.citizen_id,
        citizen_name=app.citizen.full_name if app.citizen else None,
        citizen_email=app.citizen.email if app.citizen else None,
        citizen_phone=app.citizen.phone if app.citizen else None,
        status=app.status,
        form_data=app.form_data,
        tracking_data=app.tracking_data,
        remarks=app.remarks,
        submitted_at=app.submitted_at,
        updated_at=app.updated_at,
        timeline=timeline_events,
        documents=docs_list
    )
