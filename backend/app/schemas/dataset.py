from datetime import datetime
from typing import Optional
from pydantic import BaseModel, HttpUrl


class ScrapeRequest(BaseModel):
    url: str
    name: str
    max_reviews: int = 500


class DatasetResponse(BaseModel):
    id: int
    name: str
    source: str
    source_url: Optional[str] = None
    total_reviews: int
    created_at: datetime

    class Config:
        from_attributes = True


class AutoLabelResponse(BaseModel):
    labeled: int
    skipped_neutral: int
    skipped_no_rating: int
    detail: str
