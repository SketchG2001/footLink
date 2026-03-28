from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    club_id: int
    message: Optional[str] = Field(None, max_length=1000)


class ApplicationUpdateStatus(BaseModel):
    status: ApplicationStatus


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    player_id: int
    club_id: int
    status: ApplicationStatus
    message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    player_email: Optional[str] = None
    club_email: Optional[str] = None
