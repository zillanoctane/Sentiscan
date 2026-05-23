"""Evaluasi metrik klasifikasi: accuracy, precision, recall, F1, confusion matrix."""
from dataclasses import dataclass

from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    precision_recall_fscore_support,
)

from .classifier import TrainedModels


@dataclass
class ModelMetrics:
    accuracy: float
    precision: float
    recall: float
    f1: float
    confusion_matrix: list[list[int]]

    def as_dict(self) -> dict:
        return {
            "accuracy": round(self.accuracy, 4),
            "precision": round(self.precision, 4),
            "recall": round(self.recall, 4),
            "f1": round(self.f1, 4),
            "confusion_matrix": self.confusion_matrix,
        }


def evaluate_model(y_true, y_pred, labels=("positif", "negatif")) -> ModelMetrics:
    """Hitung metrik weighted average + confusion matrix.

    Confusion matrix berformat:
        [[TP_positif, FN_positif],
         [FP_positif, TN_positif]]

    Yaitu rows = actual (positif, negatif), cols = predicted (positif, negatif).
    """
    acc = accuracy_score(y_true, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(
        y_true, y_pred,
        average="weighted",
        labels=list(labels),
        zero_division=0,
    )
    cm = confusion_matrix(y_true, y_pred, labels=list(labels)).tolist()
    return ModelMetrics(
        accuracy=float(acc),
        precision=float(prec),
        recall=float(rec),
        f1=float(f1),
        confusion_matrix=cm,
    )


def evaluate_both(models: TrainedModels) -> tuple[ModelMetrics, ModelMetrics, str]:
    """Evaluasi NB & KNN. Kembalikan (nb, knn, best_algorithm) di mana
    best_algorithm dipilih berdasarkan F1-Score tertinggi.
    """
    y_pred_nb = models.nb.predict(models.X_test)
    y_pred_knn = models.knn.predict(models.X_test)

    nb_metrics = evaluate_model(models.y_test, y_pred_nb)
    knn_metrics = evaluate_model(models.y_test, y_pred_knn)

    best = "naive_bayes" if nb_metrics.f1 >= knn_metrics.f1 else "knn"
    return nb_metrics, knn_metrics, best
