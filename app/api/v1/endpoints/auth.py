from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token
from app.schemas.user import UserSignup, UserResponse, UserLogin
from app.schemas.token import Token
from app.services.user_service import user_service

router = APIRouter()


def _authenticate_and_issue_token(db: Session, email: str, password: str) -> dict:
    user = user_service.authenticate(db, email=email, password=password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserSignup, db: Session = Depends(get_db)):
    """
    Register a new user with email, password, and role.

    **Role options**: PLAYER, AGENT, CLUB

    **Password requirements**:
    - At least 8 characters
    - Contains at least one digit
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    """
    user = user_service.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = user_service.create(db=db, user_in=user_in)
    return user


@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user (JSON body) and return JWT access token.

    Use the returned token in the Authorization header as: `Bearer <token>`
    """
    return _authenticate_and_issue_token(db, user_credentials.email, user_credentials.password)


@router.post("/token", response_model=Token, include_in_schema=False)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2-compatible form login used by Swagger Authorize button."""
    return _authenticate_and_issue_token(db, form_data.username, form_data.password)
