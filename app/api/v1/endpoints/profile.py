from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse, ProfileWithOwner
from app.services.profile_service import profile_service
from app.utils.dependencies import get_current_active_user, require_roles

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PLAYER, UserRole.AGENT, UserRole.CLUB)),
):
    profile = profile_service.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found. Create one first.")
    return profile


@router.post("/me", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_my_profile(
    data: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PLAYER, UserRole.AGENT, UserRole.CLUB)),
):
    existing = profile_service.get_by_user_id(db, user_id=current_user.id)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Profile already exists. Use PUT to update.")
    return profile_service.create(db, user_id=current_user.id, data=data)


@router.put("/update", response_model=ProfileResponse)
def update_my_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PLAYER, UserRole.AGENT, UserRole.CLUB)),
):
    profile = profile_service.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found. Create one first.")
    return profile_service.update(db, profile=profile, data=data)


@router.get("/{profile_id}", response_model=ProfileWithOwner)
def get_profile_by_id(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PLAYER, UserRole.AGENT, UserRole.CLUB)),
):
    profile = profile_service.get_by_id(db, profile_id=profile_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return ProfileWithOwner(
        id=profile.id,
        user_id=profile.user_id,
        name=profile.name,
        age=profile.age,
        position=profile.position,
        stats=profile.stats,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
        owner_email=profile.owner.email if profile.owner else None,
        owner_role=profile.owner.role if profile.owner else None,
    )
