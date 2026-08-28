"""
Central application configuration.
All secrets/keys are read from environment variables — never hard-coded.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Core ---
    APP_NAME: str = "JobPilot AI"
    ENV: str = "development"
    DEBUG: bool = True

    # --- Database ---
    DATABASE_URL: str = "sqlite:///./jobpilot.db"

    # --- Auth ---
    JWT_SECRET: str = "CHANGE_ME_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h

    # --- LLM / AI ---
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "claude-sonnet-4-6"
    LLM_BASE_URL: Optional[str] = None
    

    

    # --- Job Providers (all optional; feature degrades gracefully) ---
    # Adzuna is a free/legitimate job search API: https://developer.adzuna.com/
    ADZUNA_APP_ID: Optional[str] = None
    ADZUNA_APP_KEY: Optional[str] = None

    # Remotive is a free, no-key-required legitimate remote job API.
    REMOTIVE_ENABLED: bool = True

    # --- SMTP (optional) ---
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: Optional[str] = None

    # --- Uploads ---
    UPLOAD_DIR: str = "../uploads"
    MAX_UPLOAD_MB: int = 5

    # --- Demo mode ---
    # When True and no real job provider is configured, the app clearly
    # labels any sample data as DEMO and never presents it as live.
    ALLOW_DEMO_MODE: bool = True


settings = Settings()
