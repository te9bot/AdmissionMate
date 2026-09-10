from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "AdmissionMate"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://admissionmate:admissionmate@localhost:5433/admissionmate"

    @field_validator("DATABASE_URL")
    @classmethod
    def _use_asyncpg_driver(cls, v: str) -> str:
        # Managed Postgres hosts (Render, Heroku, ...) hand out plain
        # postgres:// / postgresql:// URLs; SQLAlchemy needs the asyncpg driver.
        if v.startswith("postgres://"):
            return "postgresql+asyncpg://" + v[len("postgres://") :]
        if v.startswith("postgresql://"):
            return "postgresql+asyncpg://" + v[len("postgresql://") :]
        return v
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    OTP_LENGTH: int = 6
    OTP_TTL_SECONDS: int = 600
    OTP_REQUEST_LIMIT: str = "5/10minutes"

    EXAM_CACHE_TTL_SECONDS: int = 300

    EMAIL_BACKEND: str = "console"  # console | smtp
    EMAIL_FROM: str = "no-reply@admissionmate.app"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True

    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    NOTIFICATION_JOB_HOUR: int = 8
    NOTIFICATION_JOB_MINUTE: int = 0


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
