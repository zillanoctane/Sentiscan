"""Koneksi database (SQLAlchemy + MySQL via PyMySQL)."""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: buka session DB per-request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
