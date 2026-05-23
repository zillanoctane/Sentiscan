"""Endpoint dataset: scrape, upload CSV, list, paginate reviews, auto-label."""
import csv
import io
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import settings
from ..database import get_db
from ..models.dataset import Dataset
from ..models.review import Review
from ..models.user import User
from ..schemas.dataset import DatasetResponse, ScrapeRequest, AutoLabelResponse
from ..schemas.review import ReviewResponse, ReviewUpdate, ReviewPage
from ..services.scraper import scrape_tokopedia_product, ScrapeError

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


# ─── List & create ─────────────────────────────────────────
@router.get("", response_model=list[DatasetResponse])
def list_datasets(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.created_at.desc()).all()


@router.post("/scrape", response_model=DatasetResponse, status_code=201)
def scrape_dataset(
    req: ScrapeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        scraped = scrape_tokopedia_product(req.url, max_reviews=req.max_reviews)
    except ScrapeError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))

    ds = Dataset(
        user_id=user.id,
        name=req.name,
        source="scrape",
        source_url=req.url,
        total_reviews=len(scraped),
    )
    db.add(ds)
    db.flush()

    for s in scraped:
        db.add(Review(
            dataset_id=ds.id,
            product_name=s.product_name,
            brand=s.brand,
            review_text=s.review_text,
            rating=s.rating,
        ))
    db.commit()
    db.refresh(ds)
    return ds


@router.post("/upload", response_model=DatasetResponse, status_code=201)
async def upload_dataset(
    name: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Ukuran maksimal
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    raw = await file.read()
    if len(raw) > max_bytes:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                          detail=f"File melebihi batas {settings.MAX_UPLOAD_MB}MB.")

    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames or "review_text" not in reader.fieldnames:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                          detail="CSV wajib memiliki kolom 'review_text'.")

    rows = list(reader)
    if not rows:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="CSV kosong.")

    ds = Dataset(
        user_id=user.id,
        name=name,
        source="upload",
        total_reviews=len(rows),
    )
    db.add(ds)
    db.flush()

    for r in rows:
        text_val = (r.get("review_text") or "").strip()
        if not text_val:
            continue
        rating_raw = (r.get("rating") or "").strip()
        rating = int(rating_raw) if rating_raw.isdigit() and 1 <= int(rating_raw) <= 5 else None
        label = (r.get("label") or "").strip().lower()
        label = label if label in ("positif", "negatif") else None
        db.add(Review(
            dataset_id=ds.id,
            product_name=(r.get("product_name") or "").strip() or None,
            brand=(r.get("brand") or "").strip() or None,
            review_text=text_val,
            rating=rating,
            label=label,
        ))
    db.commit()
    db.refresh(ds)
    return ds


# ─── Reviews di dalam dataset ────────────────────────────
@router.get("/{dataset_id}/reviews", response_model=ReviewPage)
def list_reviews(
    dataset_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    label: Optional[str] = Query(None, pattern="^(positif|negatif)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = _get_owned_dataset(db, dataset_id, user.id)
    q = db.query(Review).filter(Review.dataset_id == ds.id)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Review.review_text.ilike(like), Review.product_name.ilike(like)))
    if label:
        q = q.filter(Review.label == label)
    total = q.count()
    items = q.order_by(Review.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return ReviewPage(total=total, page=page, page_size=page_size, items=items)


@router.patch("/{dataset_id}/reviews/{review_id}", response_model=ReviewResponse)
def update_review(
    dataset_id: int,
    review_id: int,
    payload: ReviewUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_dataset(db, dataset_id, user.id)
    rev = db.query(Review).filter(Review.id == review_id, Review.dataset_id == dataset_id).first()
    if not rev:
        raise HTTPException(404, "Ulasan tidak ditemukan.")
    if payload.review_text is not None:
        rev.review_text = payload.review_text
        rev.clean_text = None  # perlu praproses ulang
    if payload.label is not None:
        rev.label = payload.label
    db.commit()
    db.refresh(rev)
    return rev


@router.delete("/{dataset_id}/reviews/{review_id}")
def delete_review(
    dataset_id: int,
    review_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = _get_owned_dataset(db, dataset_id, user.id)
    rev = db.query(Review).filter(Review.id == review_id, Review.dataset_id == ds.id).first()
    if not rev:
        raise HTTPException(404, "Ulasan tidak ditemukan.")
    db.delete(rev)
    ds.total_reviews = max(0, ds.total_reviews - 1)
    db.commit()
    return {"ok": True}


# ─── Auto-label ────────────────────────────────────────────
@router.post("/{dataset_id}/auto-label", response_model=AutoLabelResponse)
def auto_label(
    dataset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aturan PRD 6.3: rating ≥ 4 → positif, ≤ 2 → negatif, 3 → dibuang/dilewati."""
    ds = _get_owned_dataset(db, dataset_id, user.id)
    rows = db.query(Review).filter(Review.dataset_id == ds.id).all()
    labeled = 0
    skipped_neutral = 0
    skipped_no_rating = 0
    for r in rows:
        if r.rating is None:
            skipped_no_rating += 1
            continue
        if r.rating >= 4:
            r.label = "positif"
            labeled += 1
        elif r.rating <= 2:
            r.label = "negatif"
            labeled += 1
        else:
            skipped_neutral += 1
    db.commit()
    return AutoLabelResponse(
        labeled=labeled,
        skipped_neutral=skipped_neutral,
        skipped_no_rating=skipped_no_rating,
        detail=f"{labeled} ulasan terlabeli; {skipped_neutral} netral (rating 3) dilewati; {skipped_no_rating} tanpa rating.",
    )


# ─── Helper ─────────────────────────────────────────────────
def _get_owned_dataset(db: Session, dataset_id: int, user_id: int) -> Dataset:
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(404, "Dataset tidak ditemukan atau bukan milik Anda.")
    return ds
