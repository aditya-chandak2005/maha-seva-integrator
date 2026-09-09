import os
import uuid
import hashlib
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Document, Application
from app.schemas.documents import DocumentResponse

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    document_type: str = Form(...),
    application_id: int = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validate File Extension & MIME type
    file_ext = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = [".pdf", ".jpg", ".jpeg", ".png"]
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '{file_ext}'. Allowed: {allowed_extensions}"
        )

    content = await file.read()
    file_size = len(content)

    # 2. Validate Size Limit (5MB)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum permissible size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # 3. Compute SHA-256 Checksum for document integrity
    file_hash = hashlib.sha256(content).hexdigest()

    # 4. Generate unique secure filename
    secure_filename = f"{uuid.uuid4().hex}{file_ext}"
    storage_path = os.path.join(settings.UPLOAD_DIR, secure_filename)

    with open(storage_path, "wb") as f:
        f.write(content)

    # 5. Verify application association if provided
    if application_id:
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app or (current_user.role == "CITIZEN" and app.citizen_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot associate document with this application"
            )

    doc = Document(
        application_id=application_id,
        citizen_id=current_user.id,
        document_type=document_type,
        file_name=secure_filename,
        original_file_name=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        storage_path=storage_path,
        file_hash=file_hash,
        verification_status="UPLOADED"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return doc


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Role-based access verification
    if current_user.role == "CITIZEN" and doc.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You cannot access documents belonging to another citizen"
        )

    if current_user.role == "OFFICER":
        if doc.application and current_user.department_id != doc.application.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized: Document belongs to a different department"
            )

    if not os.path.exists(doc.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Underlying document file not found on storage"
        )

    return FileResponse(
        path=doc.storage_path,
        filename=doc.original_file_name,
        media_type=doc.mime_type
    )
