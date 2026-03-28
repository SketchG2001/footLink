import enum
from sqlalchemy import Column, String, Integer, ForeignKey, Enum, Table, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import BaseModel
from app.core.database import Base

document_shares = Table(
    "document_shares",
    Base.metadata,
    Column("document_id", Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
    Column("shared_with_user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class DocumentStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    SIGNED = "SIGNED"


class Document(BaseModel):
    __tablename__ = "documents"

    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_url = Column(String, nullable=False)
    original_filename = Column(String(255), nullable=False)
    status = Column(Enum(DocumentStatus), nullable=False, default=DocumentStatus.UPLOADED)

    owner = relationship("User", back_populates="documents", lazy="joined")
    shared_with = relationship("User", secondary=document_shares, lazy="selectin")
    signatures = relationship("DocumentSignature", back_populates="document", lazy="selectin")


class DocumentSignature(BaseModel):
    __tablename__ = "document_signatures"

    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    signer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    signed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    document = relationship("Document", back_populates="signatures")
    signer = relationship("User", lazy="joined")
