from fastapi import APIRouter

from app.api.v1.endpoints import (
    agents,
    applications,
    auth,
    documents,
    messages,
    players,
    profile,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(players.router, prefix="/players", tags=["players"])
api_router.include_router(
    applications.router, prefix="/applications", tags=["applications"]
)
