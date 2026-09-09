from typing import Optional, List, Any, Dict
from pydantic import BaseModel
from datetime import datetime

class ServiceCategoryResponse(BaseModel):
    id: int
    code: str
    name: str
    name_mr: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None

    class Config:
        from_attributes = True

class ServiceListItem(BaseModel):
    id: int
    code: str
    name: str
    name_mr: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    category_id: int
    category_name: Optional[str] = None
    description: Optional[str] = None
    fee: float
    processing_days: int
    integration_type: str
    is_active: bool

    class Config:
        from_attributes = True

class ServiceDetailResponse(BaseModel):
    id: int
    code: str
    name: str
    name_mr: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    category_id: int
    category_name: Optional[str] = None
    description: Optional[str] = None
    eligibility: Optional[str] = None
    documents_required: Optional[List[Dict[str, Any]]] = None
    fee: float
    processing_days: int
    workflow_id: str
    integration_type: str
    is_active: bool
    form_schema: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True
