from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.document import (
    DocumentResponse,
    DocumentShareRequest,
    DocumentShareResponse,
    DocumentWithSignatures,
    SignatureInfo,
)
from app.services.document_service import document_service
from app.services.user_service import user_service
from app.utils.dependencies import get_current_active_user

MEDIA_TYPES = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

router = APIRouter()


@router.post(
    "/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED
)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    error = document_service._validate_file(file)
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    return document_service.upload(db, owner_id=current_user.id, file=file)


@router.get("/", response_model=list[DocumentResponse])
def list_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return document_service.list_by_owner(db, owner_id=current_user.id)


@router.get("/shared", response_model=list[DocumentResponse])
def list_shared_with_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List documents other users have shared with the current user."""
    return document_service.list_shared_with(db, user_id=current_user.id)


@router.get("/{document_id}/view")
def view_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Serve the document file. Only the owner or shared users can view."""
    document = document_service.get_by_id(db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    is_owner = document.owner_id == current_user.id
    is_shared = document_service.is_shared_with(document, current_user.id)
    if not is_owner and not is_shared:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this document",
        )

    file_path = Path(document.file_url)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk"
        )

    ext = file_path.suffix.lower()
    media_type = MEDIA_TYPES.get(ext, "application/octet-stream")

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=document.original_filename,
    )


@router.post("/{document_id}/share", response_model=DocumentShareResponse)
def share_document(
    document_id: int,
    body: DocumentShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    document = document_service.get_by_id(db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    if document.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner can share it",
        )

    target_user = user_service.get_by_id(db, user_id=body.shared_with_user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found"
        )

    document_service.share(db, document=document, target_user=target_user)

    return DocumentShareResponse(
        document_id=document.id,
        shared_with_user_id=target_user.id,
        message=f"Document shared with user {target_user.email}",
    )


@router.post("/{document_id}/sign", response_model=DocumentWithSignatures)
def sign_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    document = document_service.get_by_id(db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    if not document_service.is_shared_with(document, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only shared users can sign this document",
        )

    if document_service.has_signed(document, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already signed this document",
        )

    document = document_service.sign(db, document=document, signer=current_user)

    return DocumentWithSignatures(
        id=document.id,
        owner_id=document.owner_id,
        file_url=document.file_url,
        original_filename=document.original_filename,
        status=document.status,
        created_at=document.created_at,
        updated_at=document.updated_at,
        signatures=[
            SignatureInfo(
                signer_id=sig.signer_id,
                signer_email=sig.signer.email if sig.signer else None,
                signed_at=sig.signed_at,
            )
            for sig in document.signatures
        ],
    )
