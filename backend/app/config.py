"""
Settings loaded from environment variables (Pydantic v2).
Uses Supabase instead of a local PostgreSQL instance.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────────────
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me"
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    # ── Supabase (replaces local PostgreSQL) ──────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    # Async-compatible connection string for SQLAlchemy
    DATABASE_URL: str = ""

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_STREAM_KEY: str = "agent_events"
    REDIS_CONSUMER_GROUP: str = "backend_consumers"
    REDIS_CONSUMER_NAME: str = "backend_0"

    # ── Ollama ────────────────────────────────────────────────────────────────
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "phi4"

    # ── Anomaly thresholds ────────────────────────────────────────────────────
    COST_ALERT_THRESHOLD_USD: float = 1.00
    TOKEN_SPIKE_MULTIPLIER: float = 3.0
    LOOP_DETECTION_MAX_ITERATIONS: int = 10
    SILENT_FAILURE_TIMEOUT_SECONDS: int = 30


settings = Settings()
