import uuid
import shutil
from pathlib import Path
from typing import Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document, DocumentStatus, DocumentSignature, document_shares
from app.models.user import User

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE_MB = 10


class DocumentService:
    def __init__(self):
        self._upload_dir = Path(settings.UPLOAD_DIR)
        self._upload_dir.mkdir(parents=True, exist_ok=True)

    def _save_file(self, file: UploadFile) -> str:
        ext = Path(file.filename).suffix.lower()
        stored_name = f"{uuid.uuid4().hex}{ext}"
        dest = self._upload_dir / stored_name
        with dest.open("wb") as buf:
            shutil.copyfileobj(file.file, buf)
        return str(dest)

    @staticmethod
    def _validate_file(file: UploadFile) -> Optional[str]:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            return f"File type '{ext}' not allowed. Accepted: {', '.join(ALLOWED_EXTENSIONS)}"
        file.file.seek(0, 2)
        size_mb = file.file.tell() / (1024 * 1024)
        file.file.seek(0)
        if size_mb > MAX_FILE_SIZE_MB:
            return f"File too large ({size_mb:.1f}MB). Max: {MAX_FILE_SIZE_MB}MB"
        return None

    def upload(self, db: Session, owner_id: int, file: UploadFile) -> Document:
        file_url = self._save_file(file)
        doc = Document(
            owner_id=owner_id,
            file_url=file_url,
            original_filename=file.filename,
            status=DocumentStatus.UPLOADED,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def list_by_owner(db: Session, owner_id: int) -> list[Document]:
        return db.query(Document).filter(Document.owner_id == owner_id).order_by(Document.created_at.desc()).all()

    @staticmethod
    def list_shared_with(db: Session, user_id: int) -> list[Document]:
        return (
            db.query(Document)
            .filter(Document.shared_with.any(User.id == user_id))
            .order_by(Document.created_at.desc())
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, document_id: int) -> Optional[Document]:
        return db.query(Document).filter(Document.id == document_id).first()

    @staticmethod
    def share(db: Session, document: Document, target_user: User) -> None:
        if target_user not in document.shared_with:
            document.shared_with.append(target_user)
            db.commit()
            db.refresh(document)

    @staticmethod
    def is_shared_with(document: Document, user_id: int) -> bool:
        return any(u.id == user_id for u in document.shared_with)

    @staticmethod
    def has_signed(document: Document, user_id: int) -> bool:
        return any(s.signer_id == user_id for s in document.signatures)

    @staticmethod
    def sign(db: Session, document: Document, signer: User) -> Document:
        signature = DocumentSignature(document_id=document.id, signer_id=signer.id)
        db.add(signature)
        document.status = DocumentStatus.SIGNED
        db.commit()
        db.refresh(document)
        return document


document_service = DocumentService()
