import os
import uuid
import json
import hashlib
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Document
from app.schemas.citizen import (
    CitizenProfileResponse,
    CitizenProfileUpdateRequest,
    VaultDocumentItem,
    DigiLockerDocumentItem,
    DigiLockerPullRequest,
    DigiLockerPullResponse
)
from app.services.digilocker import DigiLockerService
from app.services.document_verifier import DocumentVerifier

router = APIRouter(prefix="/citizen", tags=["Citizen Profile & Vault"])


def _format_vault_item(doc: Document) -> VaultDocumentItem:
    ver_details = None
    score = 100
    issuer = None
    clean_reason = doc.rejection_reason

    if doc.rejection_reason and doc.rejection_reason.strip().startswith("{"):
        try:
            ver_details = json.loads(doc.rejection_reason)
            score = ver_details.get("confidence_score", 100)
            issuer = ver_details.get("issuer")
            clean_reason = ver_details.get("summary")
        except Exception:
            pass

    if not issuer:
        meta = DigiLockerService.DIGILOCKER_CATALOG.get(doc.document_type.upper())
        if meta:
            issuer = meta["issuer"]
        else:
            issuer = "Competent Authority / Self-Uploaded"

    return VaultDocumentItem(
        id=doc.id,
        document_type=doc.document_type,
        file_name=doc.file_name,
        original_file_name=doc.original_file_name,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        verification_status=doc.verification_status or "VERIFIED",
        rejection_reason=clean_reason,
        verification_details=ver_details,
        confidence_score=score,
        issuer=issuer,
        uploaded_at=doc.uploaded_at or datetime.now(),
        download_url=f"/api/v1/documents/{doc.id}/download"
    )


@router.get("/profile", response_model=CitizenProfileResponse)
def get_citizen_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch all documents in citizen's personal vault (application_id IS NULL)
    vault_docs = db.query(Document).filter(
        Document.citizen_id == current_user.id,
        Document.application_id.is_(None)
    ).order_by(Document.uploaded_at.desc()).all()

    items = [_format_vault_item(d) for d in vault_docs]

    return CitizenProfileResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        state_code=current_user.state_code or "MH",
        aadhaar_number=current_user.aadhaar_number,
        pan_number=current_user.pan_number,
        profile_data=current_user.profile_data or {},
        vault_documents=items
    )


@router.put("/profile", response_model=CitizenProfileResponse)
def update_citizen_profile(
    data: CitizenProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.full_name is not None:
        current_user.full_name = data.full_name.strip()
    if data.phone is not None:
        current_user.phone = data.phone.strip()
    if data.state_code is not None:
        current_user.state_code = data.state_code.strip().upper()
    if data.aadhaar_number is not None:
        current_user.aadhaar_number = data.aadhaar_number.strip()
    if data.pan_number is not None:
        current_user.pan_number = data.pan_number.strip().upper()

    # Update profile_data dictionary
    current_profile = dict(current_user.profile_data or {})
    if data.address is not None:
        current_profile["address"] = data.address.strip()
    if data.caste_category is not None:
        current_profile["caste_category"] = data.caste_category.strip()
    if data.beneficiary_category is not None:
        current_profile["beneficiary_category"] = data.beneficiary_category.strip()
    if data.bank_account_number is not None:
        current_profile["bank_account_number"] = data.bank_account_number.strip()
    if data.bank_ifsc is not None:
        current_profile["bank_ifsc"] = data.bank_ifsc.strip().upper()
    if data.bank_name is not None:
        current_profile["bank_name"] = data.bank_name.strip()
    if data.district is not None:
        current_profile["district"] = data.district.strip()
    if data.taluka is not None:
        current_profile["taluka"] = data.taluka.strip()
    if data.village is not None:
        current_profile["village"] = data.village.strip()
    if data.pincode is not None:
        current_profile["pincode"] = data.pincode.strip()
    if data.residence_years is not None:
        current_profile["residence_years"] = data.residence_years
    if data.place_of_birth is not None:
        current_profile["place_of_birth"] = data.place_of_birth.strip()
    if data.dob is not None:
        current_profile["dob"] = data.dob.strip()
    if data.gender is not None:
        current_profile["gender"] = data.gender.strip()
    if data.marital_status is not None:
        current_profile["marital_status"] = data.marital_status.strip()
    if data.father_or_spouse_name is not None:
        current_profile["father_or_spouse_name"] = data.father_or_spouse_name.strip()
    if data.sub_caste is not None:
        current_profile["sub_caste"] = data.sub_caste.strip()
    if data.ration_card_no is not None:
        current_profile["ration_card_no"] = data.ration_card_no.strip()
    if data.annual_family_income is not None:
        current_profile["annual_family_income"] = data.annual_family_income
    if data.profile_data:
        current_profile.update(data.profile_data)

    current_user.profile_data = current_profile

    db.commit()
    db.refresh(current_user)

    return get_citizen_profile(current_user=current_user, db=db)


@router.post("/vault/upload", response_model=VaultDocumentItem)
async def upload_vault_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file_ext = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = [".pdf"]
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '{file_ext}'. All documents must strictly be uploaded in .pdf format."
        )

    content = await file.read()
    file_size = len(content)
    max_bytes = settings.MAX_UPLOAD_SIZE_KB * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum permissible size of {settings.MAX_UPLOAD_SIZE_KB}KB (received {round(file_size / 1024, 1)}KB)."
        )

    file_hash = hashlib.sha256(content).hexdigest()
    secure_filename = f"vault_{current_user.id}_{uuid.uuid4().hex[:8]}{file_ext}"
    storage_path = os.path.join(settings.UPLOAD_DIR, secure_filename)

    with open(storage_path, "wb") as f:
        f.write(content)

    # Run automated document verification through the system
    user_name = current_user.full_name or ((current_user.profile_data or {}).get("full_name") if current_user.profile_data else None)
    ver_res = DocumentVerifier.verify_document(
        pdf_bytes=content,
        document_type=document_type,
        user_name=user_name,
        original_filename=file.filename
    )
    verification_json = json.dumps(ver_res)
    ver_status = ver_res.get("verification_status", "SYSTEM_VERIFIED")

    # Check if a vault doc of this type already exists for user
    existing_doc = db.query(Document).filter(
        Document.citizen_id == current_user.id,
        Document.application_id.is_(None),
        Document.document_type == document_type
    ).first()

    if existing_doc:
        existing_doc.file_name = secure_filename
        existing_doc.original_file_name = file.filename
        existing_doc.mime_type = file.content_type or "application/octet-stream"
        existing_doc.file_size = file_size
        existing_doc.storage_path = storage_path
        existing_doc.file_hash = file_hash
        existing_doc.verification_status = ver_status
        existing_doc.rejection_reason = verification_json
        existing_doc.uploaded_at = datetime.now()
        doc = existing_doc
    else:
        doc = Document(
            application_id=None,
            citizen_id=current_user.id,
            document_type=document_type,
            file_name=secure_filename,
            original_file_name=file.filename,
            mime_type=file.content_type or "application/octet-stream",
            file_size=file_size,
            storage_path=storage_path,
            file_hash=file_hash,
            verification_status=ver_status,
            rejection_reason=verification_json
        )
        db.add(doc)

    db.commit()
    db.refresh(doc)
    return _format_vault_item(doc)


@router.get("/digilocker/available", response_model=List[DigiLockerDocumentItem])
def get_digilocker_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List issued certificates available in Citizen's linked DigiLocker account."""
    return DigiLockerService.get_available_documents(citizen=current_user, db=db)


@router.post("/digilocker/pull", response_model=DigiLockerPullResponse)
def pull_digilocker_documents(
    payload: DigiLockerPullRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pull selected government certificates from DigiLocker into MahaSeva Vault with automatic verification."""
    pulled_docs = DigiLockerService.pull_documents_into_vault(
        citizen=current_user,
        document_types=payload.document_types,
        db=db
    )
    formatted = [_format_vault_item(d) for d in pulled_docs]
    return DigiLockerPullResponse(
        success=True,
        message=f"Successfully synchronized {len(pulled_docs)} verified document(s) from DigiLocker into your MahaSeva Vault.",
        pulled_count=len(pulled_docs),
        documents=formatted
    )


@router.post("/vault/{document_id}/verify", response_model=VaultDocumentItem)
def verify_vault_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Re-run automated system verification engine on an existing vault document."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.citizen_id == current_user.id,
        Document.application_id.is_(None)
    ).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault document not found"
        )

    file_path = doc.storage_path
    if not os.path.exists(file_path):
        candidate = os.path.join(settings.UPLOAD_DIR, os.path.basename(file_path))
        if os.path.exists(candidate):
            file_path = candidate

    if not os.path.exists(file_path):
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        pdf_bytes = DigiLockerService.generate_authentic_certificate_pdf(
            document_type=doc.document_type,
            citizen_name=current_user.full_name or "Verified Citizen"
        )
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)
    else:
        with open(file_path, "rb") as f:
            pdf_bytes = f.read()

    user_name = current_user.full_name or ((current_user.profile_data or {}).get("full_name") if current_user.profile_data else None)
    ver_res = DocumentVerifier.verify_document(
        pdf_bytes=pdf_bytes,
        document_type=doc.document_type,
        user_name=user_name,
        original_filename=doc.original_file_name
    )

    doc.verification_status = ver_res.get("verification_status", "SYSTEM_VERIFIED")
    doc.rejection_reason = json.dumps(ver_res)
    db.commit()
    db.refresh(doc)
    return _format_vault_item(doc)


@router.delete("/vault/{document_id}")
def delete_vault_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.citizen_id == current_user.id,
        Document.application_id.is_(None)
    ).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault document not found"
        )

    # Remove file on disk if exists
    if os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return {"message": "Vault document removed successfully", "success": True}
