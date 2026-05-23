"""Sentiscan FastAPI entrypoint.

Jalankan dengan:
    uvicorn app.main:app --reload --port 8001

Dokumentasi interaktif:
    http://localhost:8001/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine

# Import seluruh model agar SQLAlchemy mengetahuinya saat create_all
from .models import User, Dataset, Review, Experiment  # noqa: F401

from .routers import auth as auth_router
from .routers import datasets as datasets_router
from .routers import preprocessing as preprocessing_router
from .routers import modeling as modeling_router
from .routers import results as results_router
from .routers import reviews as reviews_router


app = FastAPI(
    title="Sentiscan API",
    description=(
        "Analisis Sentimen Ulasan Smartphone Tokopedia — "
        "Perbandingan Naïve Bayes vs K-Nearest Neighbor."
    ),
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Buat tabel jika belum ada (development only).
    Untuk produksi, gunakan Alembic migrations."""
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "app": "Sentiscan API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "ok",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# ── Routers ────────────────────────────────────────────────
app.include_router(auth_router.router)
app.include_router(datasets_router.router)
app.include_router(preprocessing_router.router)
app.include_router(modeling_router.router)
app.include_router(results_router.router)
app.include_router(reviews_router.router)
