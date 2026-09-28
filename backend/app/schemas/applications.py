from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class ApplicationCreateRequest(BaseModel):
    service_id: int
    form_data: Dict[str, Any]
    status: Optional[str] = "SUBMITTED"
    vault_document_ids: Optional[List[int]] = None

class TimelineEventResponse(BaseModel):
    id: int
    old_status: Optional[str] = None
    new_status: str
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationListItem(BaseModel):
    id: int
    application_number: str
    service_id: int
    service_name: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    citizen_id: int
    citizen_name: Optional[str] = None
    status: str
    submitted_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ApplicationDetailResponse(BaseModel):
    id: int
    application_number: str
    service_id: int
    service_name: Optional[str] = None
    service_code: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    citizen_id: int
    citizen_name: Optional[str] = None
    citizen_email: Optional[str] = None
    citizen_phone: Optional[str] = None
    status: str
    form_data: Optional[Dict[str, Any]] = None
    tracking_data: Optional[Dict[str, Any]] = None
    remarks: Optional[str] = None
    submitted_at: datetime
    updated_at: Optional[datetime] = None
    timeline: List[TimelineEventResponse] = []
    documents: List[Any] = []

    class Config:
        from_attributes = True

class StatusUpdateRequest(BaseModel):
    new_status: str
    remarks: Optional[str] = None
