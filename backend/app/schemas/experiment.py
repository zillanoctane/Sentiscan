from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class TrainRequest(BaseModel):
    dataset_id: int
    test_size: float = Field(default=0.20, ge=0.10, le=0.40)
    knn_k: int = Field(default=5, ge=1, le=25)
    experiment_name: Optional[str] = None


class PredictRequest(BaseModel):
    text: str = Field(min_length=1)


class PredictResponse(BaseModel):
    naive_bayes: Literal["positif", "negatif"]
    knn: Literal["positif", "negatif"]
    nb_confidence: float
    knn_confidence: float
    agreed: bool


class Metrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1: float
    confusion_matrix: List[List[int]]


class ExperimentSummary(BaseModel):
    id: int
    name: Optional[str]
    dataset_id: int
    test_size: float
    knn_k: int
    best_algorithm: str
    nb_f1: float
    knn_f1: float
    created_at: datetime

    class Config:
        from_attributes = True


class ExperimentResponse(BaseModel):
    id: int
    name: Optional[str]
    dataset_id: int
    test_size: float
    knn_k: int
    nb_metrics: Metrics
    knn_metrics: Metrics
    best_algorithm: str
    duration_sec: Optional[float]
    created_at: datetime
