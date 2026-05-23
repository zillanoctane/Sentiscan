"""Konfigurasi aplikasi, dibaca dari .env."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://sentiscan:sentiscan123@localhost:3306/sentiscan"

    JWT_SECRET: str = "ganti-secret-ini-untuk-produksi"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 120

    CORS_ORIGINS: str = "http://localhost:8000,http://127.0.0.1:8000,http://localhost:5500,http://127.0.0.1:5500"

    MAX_UPLOAD_MB: int = 10
    SCRAPER_TIMEOUT_SEC: int = 15
    SCRAPER_USER_AGENT: str = "Mozilla/5.0 (compatible; SentiscanBot/1.0)"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
