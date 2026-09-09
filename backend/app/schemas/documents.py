from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class DocumentResponse(BaseModel):
    id: int
    application_id: Optional[int] = None
    citizen_id: int
    document_type: str
    file_name: str
    original_file_name: str
    mime_type: str
    file_size: int
    file_hash: Optional[str] = None
    verification_status: str
    rejection_reason: Optional[str] = None
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True

class DocumentVerifyRequest(BaseModel):
    status: str  # "VERIFIED" or "REJECTED" or "RESUBMISSION_REQUIRED"
    remarks: Optional[str] = None
