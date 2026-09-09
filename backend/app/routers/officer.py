from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import require_roles, RoleEnum
from app.models import (
    User, Application, ApplicationEvent, Document,
    Notification, AuditLog
)
from app.schemas.applications import (
    ApplicationListItem,
    ApplicationDetailResponse,
    StatusUpdateRequest
)
from app.schemas.documents import DocumentVerifyRequest
from app.routers.applications import get_application_detail_response

router = APIRouter(prefix="/officer", tags=["Officer Operations"])

@router.get("/applications", response_model=List[ApplicationListItem])
def get_officer_application_queue(
    status_filter: Optional[str] = Query(None, description="Filter by status (e.g. SUBMITTED, UNDER_REVIEW)"),
    search: Optional[str] = Query(None, description="Search by citizen name or application number"),
    current_user: User = Depends(require_roles([RoleEnum.OFFICER, RoleEnum.DEPARTMENT_ADMIN, RoleEnum.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    query = db.query(Application)

    # Scoped to officer's department if not Super Admin
    if current_user.role == RoleEnum.OFFICER and current_user.department_id:
        query = query.filter(Application.department_id == current_user.department_id)

    if status_filter:
        query = query.filter(Application.status == status_filter.strip())

    if search:
        pattern = f"%{search.strip()}%"
        query = query.join(User, Application.citizen_id == User.id).filter(
            or_(
                Application.application_number.ilike(pattern),
                User.full_name.ilike(pattern)
            )
        )

    apps = query.order_by(Application.submitted_at.asc()).all()

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
            citizen_name=a.citizen.full_name if a.citizen else None,
            status=a.status,
            submitted_at=a.submitted_at,
            updated_at=a.updated_at
        ))
    return result


@router.get("/applications/{application_id}", response_model=ApplicationDetailResponse)
def get_application_for_officer(
    application_id: int,
    current_user: User = Depends(require_roles([RoleEnum.OFFICER, RoleEnum.DEPARTMENT_ADMIN, RoleEnum.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    if current_user.role == RoleEnum.OFFICER and current_user.department_id != app.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You cannot access applications outside your assigned department"
        )

    return get_application_detail_response(app)


@router.patch("/applications/{application_id}/status", response_model=ApplicationDetailResponse)
def update_application_status(
    application_id: int,
    data: StatusUpdateRequest,
    current_user: User = Depends(require_roles([RoleEnum.OFFICER, RoleEnum.DEPARTMENT_ADMIN, RoleEnum.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    if current_user.role == RoleEnum.OFFICER and current_user.department_id != app.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Application does not belong to your department"
        )

    old_status = app.status
    app.status = data.new_status
    if data.remarks:
        app.remarks = data.remarks
    app.updated_at = datetime.now()

    # Create immutable event record
    event = ApplicationEvent(
        application_id=app.id,
        old_status=old_status,
        new_status=data.new_status,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        remarks=data.remarks or f"Status updated to {data.new_status} by department officer."
    )
    db.add(event)

    # Dispatch in-app notification to the citizen
    db.add(Notification(
        user_id=app.citizen_id,
        application_id=app.id,
        title=f"Application Status Updated: {data.new_status}",
        message=f"Your application {app.application_number} is now '{data.new_status}'. Remark: {data.remarks or 'No remarks provided.'}",
        notification_type="STATUS_CHANGED"
    ))

    # Append to security audit log
    db.add(AuditLog(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="STATUS_CHANGED",
        entity_type="APPLICATION",
        entity_id=str(app.id),
        details={"old_status": old_status, "new_status": data.new_status, "remarks": data.remarks}
    ))

    db.commit()
    db.refresh(app)
    return get_application_detail_response(app)


@router.post("/documents/{document_id}/verify")
def verify_document(
    document_id: int,
    data: DocumentVerifyRequest,
    current_user: User = Depends(require_roles([RoleEnum.OFFICER, RoleEnum.DEPARTMENT_ADMIN, RoleEnum.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    doc.verification_status = data.status
    doc.rejection_reason = data.remarks if data.status != "VERIFIED" else None
    doc.verified_by = current_user.id
    doc.verified_at = datetime.now()

    # Log audit
    db.add(AuditLog(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action=f"DOCUMENT_{data.status}",
        entity_type="DOCUMENT",
        entity_id=str(doc.id),
        details={"status": data.status, "remarks": data.remarks}
    ))

    db.commit()
    return {
        "message": f"Document successfully marked as {data.status}",
        "document_id": doc.id,
        "verification_status": doc.verification_status
    }
