from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Backend-only settings per docs/STACK.md's required environment variables."""

    gemini_api_key: str
    firebase_project_id: str
    firebase_client_email: str
    firebase_private_key: str
    staff_auth_secret: str
    frontend_origin: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
