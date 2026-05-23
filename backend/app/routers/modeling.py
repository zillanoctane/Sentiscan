"""Endpoint pemodelan: train (NB + KNN), predict, dan cache model in-memory."""
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models.dataset import Dataset
from ..models.experiment import Experiment
from ..models.review import Review
from ..models.user import User
from ..schemas.experiment import (
    TrainRequest, PredictRequest, PredictResponse, ExperimentResponse, Metrics,
)
from ..services.classifier import train_models, predict_single
from ..services.evaluator import evaluate_both
from ..services.preprocessor import preprocess

router = APIRouter(prefix="/api/modeling", tags=["modeling"])

# In-memory cache: model terlatih per user untuk endpoint /predict.
# Untuk produksi gunakan Redis / joblib pickle ke disk.
_MODEL_CACHE: dict[int, dict] = {}


@router.post("/train", response_model=ExperimentResponse)
def train(
    req: TrainRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = db.query(Dataset).filter(Dataset.id == req.dataset_id, Dataset.user_id == user.id).first()
    if not ds:
        raise HTTPException(404, "Dataset tidak ditemukan.")

    # Ambil ulasan terlabeli yang sudah punya clean_text
    rows = (
        db.query(Review)
          .filter(Review.dataset_id == ds.id, Review.label.in_(["positif", "negatif"]))
          .all()
    )
    if len(rows) < 20:
        raise HTTPException(400, "Dataset terlalu kecil. Minimum 20 ulasan terlabeli.")

    # Auto-fill clean_text bila ada yang null
    texts = []
    labels = []
    for r in rows:
        if not r.clean_text:
            r.clean_text = preprocess(r.review_text)
        texts.append(r.clean_text)
        labels.append(r.label)
    db.commit()

    # Train
    start = time.time()
    models = train_models(
        texts=texts,
        labels=labels,
        test_size=req.test_size,
        knn_k=req.knn_k,
        random_state=42,
    )
    nb_metrics, knn_metrics, best = evaluate_both(models)
    duration = round(time.time() - start, 2)

    # Persist experiment
    exp = Experiment(
        user_id=user.id,
        dataset_id=ds.id,
        name=req.experiment_name or f"Eksperimen {ds.name}",
        test_size=req.test_size,
        knn_k=req.knn_k,
        nb_metrics=nb_metrics.as_dict(),
        knn_metrics=knn_metrics.as_dict(),
        best_algorithm=best,
        duration_sec=duration,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    # Cache model untuk endpoint predict
    _MODEL_CACHE[user.id] = {
        "vectorizer": models.vectorizer,
        "nb": models.nb,
        "knn": models.knn,
        "experiment_id": exp.id,
    }

    return ExperimentResponse(
        id=exp.id,
        name=exp.name,
        dataset_id=exp.dataset_id,
        test_size=float(exp.test_size),
        knn_k=exp.knn_k,
        nb_metrics=Metrics(**nb_metrics.as_dict()),
        knn_metrics=Metrics(**knn_metrics.as_dict()),
        best_algorithm=exp.best_algorithm,
        duration_sec=float(exp.duration_sec) if exp.duration_sec else None,
        created_at=exp.created_at,
    )


@router.post("/predict", response_model=PredictResponse)
def predict(
    req: PredictRequest,
    user: User = Depends(get_current_user),
):
    cache = _MODEL_CACHE.get(user.id)
    if not cache:
        raise HTTPException(400, "Belum ada model terlatih. Jalankan /train terlebih dahulu.")

    clean = preprocess(req.text)
    nb_label, nb_conf = predict_single(clean, cache["vectorizer"], cache["nb"])
    knn_label, knn_conf = predict_single(clean, cache["vectorizer"], cache["knn"])

    return PredictResponse(
        naive_bayes=nb_label,
        knn=knn_label,
        nb_confidence=round(nb_conf, 4),
        knn_confidence=round(knn_conf, 4),
        agreed=(nb_label == knn_label),
    )
