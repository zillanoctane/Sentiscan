"""Endpoint untuk pelanggan: kirim ulasan + lihat ulasan sendiri."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_role
from ..database import get_db
from ..models.dataset import Dataset
from ..models.review import Review
from ..models.user import User
from ..schemas.review import CustomerReviewCreate, ReviewResponse

router = APIRouter(prefix="/api/reviews", tags=["customer-reviews"])


@router.post("/customer", response_model=ReviewResponse, status_code=201)
def submit_review(
    payload: CustomerReviewCreate,
    user: User = Depends(require_role("pelanggan", "analis", "admin")),
    db: Session = Depends(get_db),
):
    """Kirim ulasan baru. Otomatis di-auto-label dari rating sesuai PRD 6.3."""
    # Pastikan ada dataset 'customer' untuk user ini
    ds = (
        db.query(Dataset)
          .filter(Dataset.user_id == user.id, Dataset.source == "customer")
          .first()
    )
    if not ds:
        ds = Dataset(
            user_id=user.id,
            name=f"Ulasan dari {user.name}",
            source="customer",
            total_reviews=0,
        )
        db.add(ds)
        db.flush()

    # Auto-label dari rating
    if payload.rating >= 4:
        label = "positif"
    elif payload.rating <= 2:
        label = "negatif"
    else:
        label = None  # netral → di luar scope

    rev = Review(
        dataset_id=ds.id,
        user_id=user.id,
        product_name=payload.product_name,
        brand=payload.brand,
        review_text=payload.review_text,
        rating=payload.rating,
        label=label,
    )
    db.add(rev)
    ds.total_reviews = (ds.total_reviews or 0) + 1
    db.commit()
    db.refresh(rev)
    return rev


@router.get("/customer/mine", response_model=list[ReviewResponse])
def my_reviews(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ulasan yang pernah dikirim user ini (untuk halaman 'Ulasan saya')."""
    return (
        db.query(Review)
          .filter(Review.user_id == user.id)
          .order_by(Review.created_at.desc())
          .all()
    )
