from sqlalchemy import JSON, Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel

agent_players = Table(
    "agent_players",
    Base.metadata,
    Column(
        "agent_id",
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "player_id",
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Profile(BaseModel):
    __tablename__ = "profiles"

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    name = Column(String(100), nullable=False)

    # Player-specific
    age = Column(Integer, nullable=True)
    position = Column(String(50), nullable=True)
    stats = Column(JSON, nullable=True)

    # Agent-specific
    agency_name = Column(String(100), nullable=True)
    license_number = Column(String(50), nullable=True)
    experience_years = Column(Integer, nullable=True)

    # Club-specific
    location = Column(String(100), nullable=True)
    league = Column(String(100), nullable=True)
    founded_year = Column(Integer, nullable=True)

    owner = relationship("User", back_populates="profile", lazy="joined")
