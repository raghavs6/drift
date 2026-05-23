from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://drift:drift@localhost:5432/drift"
    anthropic_api_key: str | None = None
    rate_limit_max_requests: int = 5
    rate_limit_window_seconds: int = 60


settings = Settings()
