from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.user import UserRole


class ProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    # Player
    age: Optional[int] = Field(None, ge=5, le=60)
    position: Optional[str] = Field(None, max_length=50)
    stats: Optional[dict[str, Any]] = None
    # Agent
    agency_name: Optional[str] = Field(None, max_length=100)
    license_number: Optional[str] = Field(None, max_length=50)
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    # Club
    location: Optional[str] = Field(None, max_length=100)
    league: Optional[str] = Field(None, max_length=100)
    founded_year: Optional[int] = Field(None, ge=1800, le=2100)


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    # Player
    age: Optional[int] = Field(None, ge=5, le=60)
    position: Optional[str] = Field(None, max_length=50)
    stats: Optional[dict[str, Any]] = None
    # Agent
    agency_name: Optional[str] = Field(None, max_length=100)
    license_number: Optional[str] = Field(None, max_length=50)
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    # Club
    location: Optional[str] = Field(None, max_length=100)
    league: Optional[str] = Field(None, max_length=100)
    founded_year: Optional[int] = Field(None, ge=1800, le=2100)


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    # Player
    age: Optional[int] = None
    position: Optional[str] = None
    stats: Optional[dict[str, Any]] = None
    # Agent
    agency_name: Optional[str] = None
    license_number: Optional[str] = None
    experience_years: Optional[int] = None
    # Club
    location: Optional[str] = None
    league: Optional[str] = None
    founded_year: Optional[int] = None

    created_at: datetime
    updated_at: Optional[datetime] = None


class ProfileWithOwner(ProfileResponse):
    owner_email: Optional[str] = None
    owner_role: Optional[UserRole] = None
