from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field


class ReviewResponse(BaseModel):
    id: int
    product_name: Optional[str]
    brand: Optional[str]
    review_text: str
    rating: Optional[int]
    label: Optional[Literal["positif", "negatif"]]
    clean_text: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewUpdate(BaseModel):
    review_text: Optional[str] = None
    label: Optional[Literal["positif", "negatif"]] = None


class ReviewPage(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ReviewResponse]


class CustomerReviewCreate(BaseModel):
    """Untuk pelanggan login mengirim ulasan."""
    product_name: str = Field(min_length=2, max_length=255)
    review_text: str = Field(min_length=10)
    rating: int = Field(ge=1, le=5)
    brand: Optional[str] = None
