import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.exceptions import register_exception_handlers
from app.api.v1.router import api_router

setup_logging()
logger = logging.getLogger(__name__)

TAGS_METADATA = [
    {"name": "authentication", "description": "User signup, login, and JWT token management."},
    {"name": "users", "description": "Authenticated user account operations."},
    {"name": "profile", "description": "Player / Agent / Club profile management."},
    {"name": "documents", "description": "Document upload, sharing, and e-signing workflows."},
    {"name": "messages", "description": "Direct messaging between platform users."},
    {"name": "agents", "description": "Agent-player roster management."},
    {"name": "players", "description": "Player database search for clubs and agents."},
    {"name": "applications", "description": "Player-to-club application workflow."},
]

_is_dev = settings.ENVIRONMENT == "development"

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "FootLink is a web platform for football players, agents, and clubs. "
        "It combines player profiles, secure document management with electronic signatures, "
        "and structured communication — all through a scalable, API-first architecture."
    ),
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json" if _is_dev else None,
    docs_url="/docs" if _is_dev else None,
    redoc_url="/redoc" if _is_dev else None,
    openapi_tags=TAGS_METADATA if _is_dev else None,
)

register_exception_handlers(app)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

logger.info("FootLink %s started [env=%s]", settings.VERSION, settings.ENVIRONMENT)


@app.get("/", tags=["health"])
def root():
    resp = {"message": "Welcome to FootLink API", "version": settings.VERSION}
    if _is_dev:
        resp["docs"] = "/docs"
    return resp


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}
