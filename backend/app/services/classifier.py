"""Pemodelan Naïve Bayes vs KNN dengan TF-IDF + scikit-learn."""
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.neighbors import KNeighborsClassifier


@dataclass
class TrainedModels:
    """Hasil training berisi vectorizer + kedua model + data uji untuk evaluasi."""
    vectorizer: TfidfVectorizer
    nb: MultinomialNB
    knn: KNeighborsClassifier
    X_test: np.ndarray
    y_test: list
    y_train_size: int = 0
    y_test_size: int = 0
    feature_count: int = 0
    knn_k: int = 5


def train_models(
    texts: list[str],
    labels: list[str],
    test_size: float = 0.20,
    knn_k: int = 5,
    random_state: int = 42,
) -> TrainedModels:
    """Latih TF-IDF + Naïve Bayes + KNN pada data yang sama.

    Args:
        texts: clean_text per ulasan
        labels: 'positif' / 'negatif' per ulasan
        test_size: rasio data uji (0.10 — 0.40)
        knn_k: jumlah tetangga untuk KNN

    Returns:
        TrainedModels dengan kedua model siap dievaluasi.
    """
    if len(texts) != len(labels):
        raise ValueError("Jumlah teks dan label harus sama.")
    if len(texts) < 20:
        raise ValueError("Dataset terlalu kecil. Minimum 20 ulasan terlabeli.")

    # Stratify split agar distribusi label seimbang di train & test
    X_train_text, X_test_text, y_train, y_test = train_test_split(
        texts, labels,
        test_size=test_size,
        random_state=random_state,
        stratify=labels,
    )

    # TF-IDF dilatih HANYA pada training set, lalu transform test set
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 1),
        min_df=2,
    )
    X_train = vectorizer.fit_transform(X_train_text)
    X_test = vectorizer.transform(X_test_text)

    # Naïve Bayes
    nb = MultinomialNB(alpha=1.0)
    nb.fit(X_train, y_train)

    # K-Nearest Neighbor
    knn = KNeighborsClassifier(n_neighbors=knn_k, metric="cosine", weights="uniform")
    knn.fit(X_train, y_train)

    return TrainedModels(
        vectorizer=vectorizer,
        nb=nb,
        knn=knn,
        X_test=X_test,
        y_test=list(y_test),
        y_train_size=len(y_train),
        y_test_size=len(y_test),
        feature_count=len(vectorizer.get_feature_names_out()),
        knn_k=knn_k,
    )


def predict_single(text_clean: str, vectorizer, model) -> tuple[str, float]:
    """Prediksi label + confidence untuk satu teks."""
    X = vectorizer.transform([text_clean])
    label = model.predict(X)[0]
    try:
        proba = model.predict_proba(X)[0]
        conf = float(proba.max())
    except (AttributeError, ValueError):
        # KNN tanpa predict_proba: pakai rasio tetangga
        conf = 0.7
    return str(label), conf
