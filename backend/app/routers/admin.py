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

router = APIRouter(prefix="/admin", tags=["Admin & Analytics"])

@router.get("/analytics/overview", response_model=AdminAnalyticsOverview)
def get_analytics_overview(
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.DEPARTMENT_ADMIN])),
    db: Session = Depends(get_db)
):
    total_apps = db.query(Application).count()
    approved = db.query(Application).filter(Application.status == "APPROVED").count()
    rejected = db.query(Application).filter(Application.status == "REJECTED").count()
    pending = total_apps - (approved + rejected)

    total_services = db.query(Service).filter(Service.is_active == True).count()
    total_departments = db.query(Department).filter(Department.is_active == True).count()
    total_citizens = db.query(User).filter(User.role == RoleEnum.CITIZEN).count()

    # Status Distribution
    status_counts = db.query(
        Application.status, func.count(Application.id)
    ).group_by(Application.status).all()
    
    distribution = [
        StatusDistribution(status=s, count=c) for s, c in status_counts
    ]

    # Department Workload
    depts = db.query(Department).filter(Department.is_active == True).all()
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
