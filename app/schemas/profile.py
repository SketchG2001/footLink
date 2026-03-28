from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.user import UserRole


class ProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=5, le=60)
    position: Optional[str] = Field(None, max_length=50)
    stats: Optional[dict[str, Any]] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=5, le=60)
    position: Optional[str] = Field(None, max_length=50)
    stats: Optional[dict[str, Any]] = None


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    age: Optional[int] = None
    position: Optional[str] = None
    stats: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class ProfileWithOwner(ProfileResponse):
    owner_email: Optional[str] = None
    owner_role: Optional[UserRole] = None
