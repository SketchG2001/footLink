from sqlalchemy import or_, and_, union_all, literal_column
from sqlalchemy.orm import Session
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageSend, ContactResponse


class MessageService:
    @staticmethod
    def send(db: Session, sender_id: int, data: MessageSend) -> Message:
        msg = Message(sender_id=sender_id, receiver_id=data.receiver_id, content=data.content)
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return msg

    @staticmethod
    def get_conversation(db: Session, user_a: int, user_b: int) -> list[Message]:
        return (
            db.query(Message)
            .filter(
                or_(
                    and_(Message.sender_id == user_a, Message.receiver_id == user_b),
                    and_(Message.sender_id == user_b, Message.receiver_id == user_a),
                )
            )
            .order_by(Message.created_at.asc())
            .all()
        )

    @staticmethod
    def get_contacts(db: Session, user_id: int) -> list[ContactResponse]:
        sent_to = (
            db.query(Message.receiver_id.label("peer_id"))
            .filter(Message.sender_id == user_id)
            .distinct()
        )
        received_from = (
            db.query(Message.sender_id.label("peer_id"))
            .filter(Message.receiver_id == user_id)
            .distinct()
        )
        peer_ids_q = sent_to.union(received_from).subquery()
        peers = (
            db.query(User)
            .filter(User.id.in_(db.query(peer_ids_q.c.peer_id)))
            .order_by(User.email)
            .all()
        )
        return [
            ContactResponse(id=u.id, email=u.email, role=u.role.value)
            for u in peers
        ]


message_service = MessageService()
