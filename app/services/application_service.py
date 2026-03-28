from typing import Optional

from sqlalchemy.orm import Session

from app.models.application import Application, ApplicationStatus
from app.schemas.application import ApplicationCreate


class ApplicationService:
    @staticmethod
    def create(db: Session, player_id: int, data: ApplicationCreate) -> Application:
        app = Application(
            player_id=player_id,
            club_id=data.club_id,
            message=data.message,
            status=ApplicationStatus.PENDING,
        )
        db.add(app)
        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def get_by_id(db: Session, application_id: int) -> Optional[Application]:
        return db.query(Application).filter(Application.id == application_id).first()

    @staticmethod
    def list_by_player(db: Session, player_id: int) -> list[Application]:
        return (
            db.query(Application)
            .filter(Application.player_id == player_id)
            .order_by(Application.created_at.desc())
            .all()
        )

    @staticmethod
    def list_by_club(db: Session, club_id: int) -> list[Application]:
        return (
            db.query(Application)
            .filter(Application.club_id == club_id)
            .order_by(Application.created_at.desc())
            .all()
        )

    @staticmethod
    def update_status(
        db: Session, application: Application, new_status: ApplicationStatus
    ) -> Application:
        application.status = new_status
        db.commit()
        db.refresh(application)
        return application

    @staticmethod
    def already_applied(db: Session, player_id: int, club_id: int) -> bool:
        return (
            db.query(Application)
            .filter(
                Application.player_id == player_id,
                Application.club_id == club_id,
                Application.status == ApplicationStatus.PENDING,
            )
            .first()
            is not None
        )


application_service = ApplicationService()
