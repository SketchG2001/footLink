from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User as UserModel
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import user_service
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: UserModel = Depends(get_current_active_user)):
    """
    Get current authenticated user profile.
    """
    return current_user


@router.put("/me", response_model=UserResponse)
def update_user_me(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    """
    Update the current authenticated user profile.
    """
    user = user_service.update(db=db, db_user=current_user, user_in=user_in)
    return user
