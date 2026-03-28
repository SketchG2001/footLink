from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

from app.models.document import DocumentStatus


class SignatureInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    signer_id: int
    signer_email: Optional[str] = None
    signed_at: datetime


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    file_url: str
    original_filename: str
    status: DocumentStatus
    created_at: datetime
    updated_at: Optional[datetime] = None


class DocumentWithSignatures(DocumentResponse):
    signatures: list[SignatureInfo] = []


class DocumentShareRequest(BaseModel):
    shared_with_user_id: int


class DocumentShareResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: int
    shared_with_user_id: int
    message: str
