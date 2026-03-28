import enum

from sqlalchemy import Column, Enum, String
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    PLAYER = "PLAYER"
    AGENT = "AGENT"
    CLUB = "CLUB"


class User(BaseModel):
    __tablename__ = "users"

    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)

    profile = relationship(
        "Profile", back_populates="owner", uselist=False, lazy="joined"
    )
    documents = relationship("Document", back_populates="owner", lazy="dynamic")

    managed_players = relationship(
        "User",
        secondary="agent_players",
        primaryjoin="User.id == agent_players.c.agent_id",
        secondaryjoin="User.id == agent_players.c.player_id",
        lazy="selectin",
    )
