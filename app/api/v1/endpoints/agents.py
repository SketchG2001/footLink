from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.agent import AgentPlayerAction, ManagedPlayerResponse
from app.services.agent_service import agent_service
from app.services.user_service import user_service
from app.utils.dependencies import require_roles

router = APIRouter()


@router.get("/players", response_model=list[ManagedPlayerResponse])
def list_managed_players(
    current_user: User = Depends(require_roles(UserRole.AGENT)),
):
    """List all players managed by the current agent."""
    return agent_service.list_players(current_user)


@router.post(
    "/players/{player_id}",
    response_model=AgentPlayerAction,
    status_code=status.HTTP_201_CREATED,
)
def add_managed_player(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.AGENT)),
):
    """Add a player to the agent's managed roster."""
    player = user_service.get_by_id(db, user_id=player_id)
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Player not found"
        )

    if player.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target user is not a player",
        )

    if agent_service.is_managing(current_user, player_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Player already managed by you"
        )

    agent_service.add_player(db, agent=current_user, player=player)
    return AgentPlayerAction(
        agent_id=current_user.id,
        player_id=player.id,
        message=f"Player {player.email} added to your roster",
    )


@router.delete("/players/{player_id}", response_model=AgentPlayerAction)
def remove_managed_player(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.AGENT)),
):
    """Remove a player from the agent's managed roster."""
    player = user_service.get_by_id(db, user_id=player_id)
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Player not found"
        )

    if not agent_service.is_managing(current_user, player_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Player is not in your roster",
        )

    agent_service.remove_player(db, agent=current_user, player=player)
    return AgentPlayerAction(
        agent_id=current_user.id,
        player_id=player.id,
        message=f"Player {player.email} removed from your roster",
    )
