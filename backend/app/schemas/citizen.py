from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class VaultDocumentItem(BaseModel):
    id: int
    document_type: str
    file_name: str
    original_file_name: str
    mime_type: str
    file_size: int
    verification_status: str
    rejection_reason: Optional[str] = None
    verification_details: Optional[Dict[str, Any]] = None
    confidence_score: Optional[int] = 100
    issuer: Optional[str] = None
    uploaded_at: datetime
    download_url: str

    class Config:
        from_attributes = True

class DigiLockerDocumentItem(BaseModel):
    document_type: str
    name: str
    name_mr: str
    name_hi: str
    category: str
    issuer: str
    issuer_code: str
    certificate_id: str
    issue_date: str
    is_in_vault: bool
    vault_document_id: Optional[int] = None
    verification_status: str
    download_url: Optional[str] = None
    description: str

class DigiLockerPullRequest(BaseModel):
    document_types: List[str]

class DigiLockerPullResponse(BaseModel):
    success: bool
    pulled_count: int
    documents: List[VaultDocumentItem]
    message: str

class CitizenProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    state_code: Optional[str] = "MH"
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    profile_data: Optional[Dict[str, Any]] = {}
    vault_documents: List[VaultDocumentItem] = []

    class Config:
        from_attributes = True

class CitizenProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    state_code: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    address: Optional[str] = None
    caste_category: Optional[str] = None
    beneficiary_category: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None
    district: Optional[str] = None
    taluka: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[str] = None
    residence_years: Optional[int] = None
    place_of_birth: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    father_or_spouse_name: Optional[str] = None
    sub_caste: Optional[str] = None
    ration_card_no: Optional[str] = None
    annual_family_income: Optional[float] = None
    profile_data: Optional[Dict[str, Any]] = None

