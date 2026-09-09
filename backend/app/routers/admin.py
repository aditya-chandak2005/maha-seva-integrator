from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import require_roles, RoleEnum
from app.models import (
    User, Application, Department, Service, ServiceCategory,
    ServiceForm, AuditLog
)
from app.schemas.analytics import (
    AdminAnalyticsOverview,
    StatusDistribution,
    DepartmentWorkload
)

from app.constants.states import get_state_info

router = APIRouter(prefix="/admin", tags=["Admin & Analytics"])

@router.get("/analytics/overview", response_model=AdminAnalyticsOverview)
def get_analytics_overview(
    state_code: Optional[str] = Query(None, description="Filter analytics by jurisdiction/state (e.g. MH, KA, DL, CENTRAL, ALL)"),
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.DEPARTMENT_ADMIN])),
    db: Session = Depends(get_db)
):
    # Determine target jurisdiction:
    # If the user is a state-specific admin, enforce their state;
    # If national admin, allow filtering via state_code query param.
    target_state = None
    if current_user.role == RoleEnum.SUPER_ADMIN and current_user.state_code and current_user.state_code not in ("ALL", None):
        target_state = current_user.state_code.upper()
    elif state_code and state_code.upper() != "ALL":
        target_state = state_code.upper()

    state_info = get_state_info(target_state) if target_state else None
    state_label = state_info.get("name", target_state) if state_info else "All India"

    # Base query for applications
    app_q = db.query(Application)
    if target_state:
        app_q = app_q.join(Service, Application.service_id == Service.id)
        if target_state == "CENTRAL":
            app_q = app_q.filter(Service.state_code == "CENTRAL")
        else:
            app_q = app_q.filter(Service.state_code == target_state)

    total_apps = app_q.count()
    approved = app_q.filter(Application.status == "APPROVED").count()
    rejected = app_q.filter(Application.status == "REJECTED").count()
    pending = total_apps - (approved + rejected)

    # Services and Departments query
    svc_q = db.query(Service).filter(Service.is_active == True)
    dept_q = db.query(Department).filter(Department.is_active == True)
    if target_state:
        svc_q = svc_q.filter(Service.state_code == target_state)
        dept_q = dept_q.filter(Department.state_code == target_state)

    total_services = svc_q.count()
    total_departments = dept_q.count()
    total_citizens = db.query(User).filter(User.role == RoleEnum.CITIZEN).count()

    # Status Distribution
    status_counts_q = db.query(Application.status, func.count(Application.id))
    if target_state:
        status_counts_q = status_counts_q.join(Service, Application.service_id == Service.id)
        if target_state == "CENTRAL":
            status_counts_q = status_counts_q.filter(Service.state_code == "CENTRAL")
        else:
            status_counts_q = status_counts_q.filter(Service.state_code == target_state)
    status_counts = status_counts_q.group_by(Application.status).all()
    
    distribution = [
        StatusDistribution(status=s, count=c) for s, c in status_counts
    ]

    # Department Workload (only departments of that target state, or all if target_state is None)
    depts = dept_q.all()
    dept_workload = []
    for d in depts:
        d_total = db.query(Application).filter(Application.department_id == d.id).count()
        d_approved = db.query(Application).filter(Application.department_id == d.id, Application.status == "APPROVED").count()
        d_rejected = db.query(Application).filter(Application.department_id == d.id, Application.status == "REJECTED").count()
        d_pending = d_total - (d_approved + d_rejected)

        dept_workload.append(DepartmentWorkload(
            department_name=d.name,
            department_code=d.code,
            total_applications=d_total,
            pending=d_pending,
            approved=d_approved,
            rejected=d_rejected
        ))

    return AdminAnalyticsOverview(
        state_code=target_state or "ALL",
        state_label=state_label,
        total_applications=total_apps,
        pending_review=pending,
        approved=approved,
        rejected=rejected,
        total_services=total_services,
        total_departments=total_departments,
        total_citizens=total_citizens,
        status_distribution=distribution,
        department_workload=dept_workload
    )


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs
