from sqlalchemy.orm import Session

from app.models.user import User


class AgentService:
    @staticmethod
    def add_player(db: Session, agent: User, player: User) -> None:
        if player not in agent.managed_players:
            agent.managed_players.append(player)
            db.commit()

    @staticmethod
    def remove_player(db: Session, agent: User, player: User) -> None:
        if player in agent.managed_players:
            agent.managed_players.remove(player)
            db.commit()

    @staticmethod
    def list_players(agent: User) -> list[User]:
        return list(agent.managed_players)

    @staticmethod
    def is_managing(agent: User, player_id: int) -> bool:
        return any(p.id == player_id for p in agent.managed_players)


agent_service = AgentService()
