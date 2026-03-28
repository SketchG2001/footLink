from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime


class MessageSend(BaseModel):
    receiver_id: int
    content: str = Field(..., min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    receiver_id: int
    content: str
    created_at: datetime
    sender_email: Optional[str] = None
    receiver_email: Optional[str] = None


class ContactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: str
