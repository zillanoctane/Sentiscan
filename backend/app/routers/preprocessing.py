"""Endpoint praproses teks."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models.dataset import Dataset
from ..models.review import Review
from ..models.user import User
from ..services.preprocessor import preprocess

router = APIRouter(prefix="/api/preprocessing", tags=["preprocessing"])


@router.post("/run")
def run_preprocessing(
    dataset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not ds:
        raise HTTPException(404, "Dataset tidak ditemukan.")

    rows = db.query(Review).filter(Review.dataset_id == ds.id).all()
    processed = 0
    for r in rows:
        r.clean_text = preprocess(r.review_text)
        processed += 1
    db.commit()
    return {"processed_count": processed, "dataset_id": ds.id}


@router.get("/preview")
def preview(
    dataset_id: int = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not ds:
        raise HTTPException(404, "Dataset tidak ditemukan.")

    rows = db.query(Review).filter(Review.dataset_id == ds.id).limit(10).all()
    return [
        {
            "id": r.id,
            "before": r.review_text,
            "after": r.clean_text or preprocess(r.review_text),
        }
        for r in rows
    ]
