from typing import List, Dict, Any
from pydantic import BaseModel

class StatusDistribution(BaseModel):
    status: str
    count: int

class DepartmentWorkload(BaseModel):
    department_name: str
    department_code: str
    total_applications: int
    pending: int
    approved: int
    rejected: int

class AdminAnalyticsOverview(BaseModel):
    total_applications: int
    pending_review: int
    approved: int
    rejected: int
    total_services: int
    total_departments: int
    total_citizens: int
    status_distribution: List[StatusDistribution]
    department_workload: List[DepartmentWorkload]
