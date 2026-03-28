from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.application import ApplicationStatus
from app.models.user import User, UserRole
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdateStatus,
    RosterPlayerResponse,
)
from app.services.application_service import application_service
from app.services.user_service import user_service
from app.utils.dependencies import get_current_active_user, require_roles

router = APIRouter()


def _to_response(app) -> ApplicationResponse:
    return ApplicationResponse(
        id=app.id,
        player_id=app.player_id,
        club_id=app.club_id,
        status=app.status,
        message=app.message,
        created_at=app.created_at,
        updated_at=app.updated_at,
        player_email=app.player.email if app.player else None,
        club_email=app.club.email if app.club else None,
    )


@router.post(
    "/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED
)
def apply_to_club(
    body: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PLAYER)),
):
    """Player applies to a club."""
    club = user_service.get_by_id(db, user_id=body.club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Club not found"
        )
    if club.role != UserRole.CLUB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Target user is not a club"
        )

    if application_service.already_applied(
        db, player_id=current_user.id, club_id=body.club_id
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending application to this club",
        )

    app = application_service.create(db, player_id=current_user.id, data=body)
    return _to_response(app)


@router.get("/", response_model=list[ApplicationResponse])
def list_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List applications: players see their sent, clubs see their received."""
    if current_user.role == UserRole.PLAYER:
        apps = application_service.list_by_player(db, player_id=current_user.id)
    elif current_user.role == UserRole.CLUB:
        apps = application_service.list_by_club(db, club_id=current_user.id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only players and clubs can view applications",
        )
    return [_to_response(a) for a in apps]


@router.get("/roster", response_model=list[RosterPlayerResponse])
def get_club_roster(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CLUB)),
):
    """List players who have been accepted by this club."""
    accepted = application_service.list_accepted_by_club(db, club_id=current_user.id)
    roster = []
    for app in accepted:
        player = app.player
        profile = player.profile if player else None
        roster.append(
            RosterPlayerResponse(
                user_id=player.id,
                email=player.email,
                name=profile.name if profile else None,
                age=profile.age if profile else None,
                position=profile.position if profile else None,
                joined_at=app.updated_at or app.created_at,
            )
        )
    return roster


@router.put("/{application_id}", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    body: ApplicationUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CLUB)),
):
    """Club accepts or rejects an application."""
    app = application_service.get_by_id(db, application_id=application_id)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )
    if app.club_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your application to review",
        )
    if app.status != ApplicationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application already processed",
        )

    app = application_service.update_status(db, application=app, new_status=body.status)
    return _to_response(app)
