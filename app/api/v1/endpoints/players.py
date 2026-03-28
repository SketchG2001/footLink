from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.profile import Profile
from app.models.user import User, UserRole
from app.schemas.profile import ProfileWithOwner
from app.utils.dependencies import require_roles

router = APIRouter()


@router.get("/", response_model=list[ProfileWithOwner])
def search_players(
    name: Optional[str] = Query(None, description="Filter by name (partial match)"),
    position: Optional[str] = Query(None, description="Filter by position"),
    min_age: Optional[int] = Query(None, ge=5, description="Minimum age"),
    max_age: Optional[int] = Query(None, le=60, description="Maximum age"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CLUB, UserRole.AGENT)),
):
    """Search player profiles. Accessible by CLUB and AGENT roles."""
    query = (
        db.query(Profile)
        .join(User, Profile.user_id == User.id)
        .filter(User.role == UserRole.PLAYER)
    )

    if name:
        query = query.filter(Profile.name.ilike(f"%{name}%"))
    if position:
        query = query.filter(Profile.position.ilike(f"%{position}%"))
    if min_age is not None:
        query = query.filter(Profile.age >= min_age)
    if max_age is not None:
        query = query.filter(Profile.age <= max_age)

    profiles = query.order_by(Profile.name).offset(offset).limit(limit).all()

    return [
        ProfileWithOwner(
            id=p.id,
            user_id=p.user_id,
            name=p.name,
            age=p.age,
            position=p.position,
            stats=p.stats,
            created_at=p.created_at,
            updated_at=p.updated_at,
            owner_email=p.owner.email if p.owner else None,
            owner_role=p.owner.role if p.owner else None,
        )
        for p in profiles
    ]
