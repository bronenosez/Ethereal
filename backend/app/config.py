"""Application settings, loaded from environment / .env file."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://ethereal:ethereal@localhost:5432/ethereal"

    secret_key: str = "change-me-to-a-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 720

    admin_username: str = "admin"
    admin_password: str = "changeme"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Besides the explicit list above, allow any localhost / loopback / private-LAN
    # host on any port, so local dev "just works" whether you open the site via
    # localhost, 127.0.0.1, a bumped Vite port (5174…), or your machine's LAN IP
    # (e.g. 192.168.x.x). Set to an empty string to disable and rely solely on
    # CORS_ORIGINS (recommended for production).
    cors_origin_regex: str = (
        r"^https?://("
        r"localhost|127\.0\.0\.1"
        r"|10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
        r"|192\.168\.\d{1,3}\.\d{1,3}"
        r"|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}"
        r")(:\d+)?$"
    )

    parser_headless: bool = True
    # In a container running as root, Chromium refuses to start without these.
    # Set PARSER_NO_SANDBOX=true in Docker/production; keep false on a desktop.
    parser_no_sandbox: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
