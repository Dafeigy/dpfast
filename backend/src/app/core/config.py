from functools import cached_property

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    app_name: str = "MicroServices Template"
    environment: str = "development"
    service_name: str = "api"
    database_url: str = "postgresql+asyncpg://app:app@localhost:5432/app"

    admin_password: str = "change-this-password"
    auth_secret: str = "change-this-to-a-long-random-value"
    auth_cookie_name: str = "admin_session"
    auth_cookie_secure: bool = False
    auth_session_ttl_seconds: int = 28_800

    cors_origins: str = "http://localhost:5173"

    database_pool_size: int = 20
    database_max_overflow: int = 20
    database_pool_timeout_seconds: int = 10

    log_persistence_enabled: bool = True
    log_retention_days: int = 30
    log_body_max_bytes: int = 262_144
    log_queue_size: int = 10_000
    log_batch_size: int = 100
    log_flush_interval_seconds: float = 0.5
    log_cleanup_interval_seconds: int = 86_400
    log_excluded_path_prefixes: str = "/api/v1/logs,/health"

    @cached_property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @cached_property
    def excluded_log_prefixes(self) -> tuple[str, ...]:
        return tuple(
            item.strip() for item in self.log_excluded_path_prefixes.split(",") if item.strip()
        )


settings = Settings()
