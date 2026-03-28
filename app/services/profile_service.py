from typing import Optional

from sqlalchemy.orm import Session

from app.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileUpdate


class ProfileService:
    @staticmethod
    def get_by_user_id(db: Session, user_id: int) -> Optional[Profile]:
        return db.query(Profile).filter(Profile.user_id == user_id).first()

    @staticmethod
    def get_by_id(db: Session, profile_id: int) -> Optional[Profile]:
        return db.query(Profile).filter(Profile.id == profile_id).first()

    @staticmethod
    def create(db: Session, user_id: int, data: ProfileCreate) -> Profile:
        profile = Profile(user_id=user_id, **data.model_dump(exclude_unset=True))
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    def update(db: Session, profile: Profile, data: ProfileUpdate) -> Profile:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile


profile_service = ProfileService()
