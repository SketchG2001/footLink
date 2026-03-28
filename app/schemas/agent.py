from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.user import UserRole


class ManagedPlayerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: UserRole
    created_at: datetime


class AgentPlayerAction(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    agent_id: int
    player_id: int
    message: str
