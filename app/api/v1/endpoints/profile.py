from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.profile import (
    ProfileCreate,
    ProfileResponse,
    ProfileUpdate,
    ProfileWithOwner,
)
from app.services.profile_service import profile_service
from app.utils.dependencies import require_roles

router = APIRouter()

ROLE_ALLOWED_FIELDS: dict[UserRole, set[str]] = {
    UserRole.PLAYER: {"name", "age", "position", "stats"},
    UserRole.AGENT: {"name", "agency_name", "license_number", "experience_years"},
    UserRole.CLUB: {"name", "location", "league", "founded_year"},
}


def _filter_for_role(data: BaseModel, role: UserRole) -> dict:
    """Return only the fields allowed for the given role, excluding unset."""
    allowed = ROLE_ALLOWED_FIELDS[role]
    return {
        k: v for k, v in data.model_dump(exclude_unset=True).items() if k in allowed
    }


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.PLAYER, UserRole.AGENT, UserRole.CLUB)
    ),
):
    profile = profile_service.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Create one first.",
        )
    return profile


@router.post("/me", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_my_profile(
    data: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.PLAYER, UserRole.AGENT, UserRole.CLUB)
    ),
):
    existing = profile_service.get_by_user_id(db, user_id=current_user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Profile already exists. Use PUT to update.",
        )
    filtered = _filter_for_role(data, current_user.role)
    return profile_service.create_from_dict(
        db, user_id=current_user.id, fields=filtered
    )


@router.put("/update", response_model=ProfileResponse)
def update_my_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.PLAYER, UserRole.AGENT, UserRole.CLUB)
    ),
):
    profile = profile_service.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Create one first.",
        )
    filtered = _filter_for_role(data, current_user.role)
    return profile_service.update_from_dict(db, profile=profile, fields=filtered)


@router.get("/{profile_id}", response_model=ProfileWithOwner)
def get_profile_by_id(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.PLAYER, UserRole.AGENT, UserRole.CLUB)
    ),
):
    profile = profile_service.get_by_id(db, profile_id=profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    return ProfileWithOwner.model_validate(profile, from_attributes=True).model_copy(
        update={
            "owner_email": profile.owner.email if profile.owner else None,
            "owner_role": profile.owner.role if profile.owner else None,
        }
    )
