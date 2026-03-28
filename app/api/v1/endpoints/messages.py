from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.message import ContactResponse, MessageResponse, MessageSend
from app.services.message_service import message_service
from app.services.user_service import user_service
from app.utils.dependencies import get_current_active_user

router = APIRouter()


def _to_response(msg) -> MessageResponse:
    return MessageResponse(
        id=msg.id,
        sender_id=msg.sender_id,
        receiver_id=msg.receiver_id,
        content=msg.content,
        created_at=msg.created_at,
        sender_email=msg.sender.email if msg.sender else None,
        receiver_email=msg.receiver.email if msg.receiver else None,
    )


@router.get("/contacts/list", response_model=list[ContactResponse])
def list_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List users the current user has exchanged messages with."""
    return message_service.get_contacts(db, user_id=current_user.id)


@router.get("/contacts/search", response_model=list[ContactResponse])
def search_users_by_email(
    q: str = Query(..., min_length=1, description="Email search term"),
    role: str | None = Query(None, description="Filter by role (PLAYER, AGENT, CLUB)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Search users by email, optionally filtered by role."""
    query = db.query(User).filter(
        User.email.ilike(f"%{q}%"), User.id != current_user.id
    )
    if role:
        query = query.filter(User.role == role.upper())
    users = query.limit(10).all()
    return [ContactResponse(id=u.id, email=u.email, role=u.role.value) for u in users]


@router.post(
    "/send", response_model=MessageResponse, status_code=status.HTTP_201_CREATED
)
def send_message(
    body: MessageSend,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if body.receiver_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send a message to yourself",
        )

    receiver = user_service.get_by_id(db, user_id=body.receiver_id)
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Receiver not found"
        )

    msg = message_service.send(db, sender_id=current_user.id, data=body)
    return _to_response(msg)


@router.get("/{user_id}", response_model=list[MessageResponse])
def get_conversation(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    peer = user_service.get_by_id(db, user_id=user_id)
    if not peer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    messages = message_service.get_conversation(
        db, user_a=current_user.id, user_b=user_id
    )
    return [_to_response(m) for m in messages]
