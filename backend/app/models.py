from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    state_code = Column(String(10), default="MH", index=True)
    name = Column(String(150), nullable=False)
    name_mr = Column(String(150), nullable=True)
    name_hi = Column(String(150), nullable=True)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    contact_email = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    services = relationship("Service", back_populates="department")
    users = relationship("User", back_populates="department")


class ServiceCategory(Base):
    __tablename__ = "service_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    name_mr = Column(String(100), nullable=True)
    name_hi = Column(String(100), nullable=True)
    code = Column(String(30), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)

    services = relationship("Service", back_populates="category")


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    state_code = Column(String(10), default="MH", index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("service_categories.id"), nullable=False)
    name = Column(String(200), nullable=False)
    name_mr = Column(String(200), nullable=True)
    name_hi = Column(String(200), nullable=True)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    description_mr = Column(Text, nullable=True)
    description_hi = Column(Text, nullable=True)
    eligibility = Column(Text, nullable=True)
    documents_required = Column(JSON, nullable=True)
    fee = Column(Float, default=0.0)
    processing_days = Column(Integer, default=7)
    workflow_id = Column(String(50), default="STANDARD")
    integration_type = Column(String(50), default="MOCK_REV")
    service_type = Column(String(50), default="DOCUMENT", index=True) # DOCUMENT or SCHEME
    scheme_type = Column(String(50), nullable=True, index=True) # AGRICULTURE, EDUCATION_SCHOLARSHIP, INDUSTRIAL_MSME, SOCIAL_WELFARE
    benefit_amount = Column(String(150), nullable=True) # e.g. ₹6,000 / year DBT, 35% Capital Subsidy
    sponsor_type = Column(String(50), default="STATE") # CENTRAL or STATE
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    department = relationship("Department", back_populates="services")
    category = relationship("ServiceCategory", back_populates="services")
    form = relationship("ServiceForm", back_populates="service", uselist=False)
    applications = relationship("Application", back_populates="service")


class ServiceForm(Base):
    __tablename__ = "service_forms"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), unique=True, nullable=False)
    form_schema = Column(JSON, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    service = relationship("Service", back_populates="form")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=True)
    full_name = Column(String(150), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="CITIZEN", index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    state_code = Column(String(10), default="MH", index=True, nullable=True)
    aadhaar_number = Column(String(20), nullable=True)
    pan_number = Column(String(20), nullable=True)
    profile_data = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    department = relationship("Department", back_populates="users")
    applications = relationship("Application", back_populates="citizen")
    documents = relationship("Document", foreign_keys="[Document.citizen_id]", back_populates="citizen")


class Citizen(Base):
    __tablename__ = "citizens"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(15), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(50), unique=True, nullable=False, index=True)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="SUBMITTED", index=True)
    form_data = Column(JSON, nullable=True)
    tracking_data = Column(JSON, nullable=True)
    remarks = Column(Text, nullable=True)
    submitted_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    citizen = relationship("User", back_populates="applications")
    service = relationship("Service", back_populates="applications")
    events = relationship("ApplicationEvent", back_populates="application", order_by="ApplicationEvent.id.asc()")
    documents = relationship("Document", back_populates="application")


class ApplicationEvent(Base):
    __tablename__ = "application_events"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(150), nullable=True)
    actor_role = Column(String(50), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    application = relationship("Application", back_populates="events")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True, index=True)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_type = Column(String(100), nullable=False)
    file_name = Column(String(255), nullable=False)
    original_file_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    storage_path = Column(String(500), nullable=False)
    file_hash = Column(String(64), nullable=True)
    verification_status = Column(String(50), default="UPLOADED", index=True)
    rejection_reason = Column(Text, nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now())

    application = relationship("Application", back_populates="documents")
    citizen = relationship("User", foreign_keys=[citizen_id], back_populates="documents")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, nullable=True)
    actor_name = Column(String(150), nullable=True)
    actor_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    entity_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class SupportRequest(Base):
    __tablename__ = "support_requests"

    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN", index=True)
    officer_response = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
