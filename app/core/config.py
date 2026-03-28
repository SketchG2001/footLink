import json

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "FootLink"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    BACKEND_CORS_ORIGINS: str = ""

    UPLOAD_DIR: str = "uploads"

    ENVIRONMENT: str = "development"

    @property
    def cors_origins(self) -> list[str]:
        if not self.BACKEND_CORS_ORIGINS:
            return []
        raw = self.BACKEND_CORS_ORIGINS.strip()
        if raw.startswith("["):
            return json.loads(raw)
        return [o.strip() for o in raw.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
