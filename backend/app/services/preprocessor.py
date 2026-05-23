"""Praproses teks Bahasa Indonesia.

6 tahap berurutan sesuai PRD 6.4:
1. Cleaning   - hapus URL, angka, tanda baca, emoji, karakter non-alfabet
2. Case folding - huruf kecil
3. Tokenizing - pisah jadi token kata
4. Stopword removal - Sastrawi stopword Indonesia
5. Stemming   - Sastrawi StemmerFactory
6. Join tokens - gabung kembali → clean_text
"""
import re
from functools import lru_cache

from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory


# URL & non-alfabet (sisakan spasi)
_URL_RE = re.compile(r"https?://\S+|www\.\S+")
_NON_ALPHA_RE = re.compile(r"[^a-zA-Z\s]")
_MULTISPACE_RE = re.compile(r"\s+")


@lru_cache(maxsize=1)
def _get_stemmer():
    return StemmerFactory().create_stemmer()


@lru_cache(maxsize=1)
def _get_stopwords() -> set:
    """Set kata berhenti Bahasa Indonesia."""
    sw_factory = StopWordRemoverFactory()
    return set(sw_factory.get_stop_words())


# ─── Tahap individual (testable) ──────────────────────────
def clean_text_raw(text: str) -> str:
    """Tahap 1: cleaning."""
    if not text:
        return ""
    text = _URL_RE.sub(" ", text)
    text = _NON_ALPHA_RE.sub(" ", text)
    return _MULTISPACE_RE.sub(" ", text).strip()


def case_fold(text: str) -> str:
    """Tahap 2: case folding."""
    return text.lower()


def tokenize(text: str) -> list[str]:
    """Tahap 3: tokenizing."""
    return [t for t in text.split() if t]


def remove_stopwords(tokens: list[str]) -> list[str]:
    """Tahap 4: stopword removal."""
    stops = _get_stopwords()
    return [t for t in tokens if t not in stops]


def stem_tokens(tokens: list[str]) -> list[str]:
    """Tahap 5: stemming Sastrawi."""
    stemmer = _get_stemmer()
    return [stemmer.stem(t) for t in tokens]


def join_tokens(tokens: list[str]) -> str:
    """Tahap 6: join → clean_text."""
    return " ".join(tokens)


# ─── Pipeline lengkap ────────────────────────────────────
def preprocess(text: str) -> str:
    """Jalankan keenam tahap. Kembalikan clean_text."""
    text = clean_text_raw(text)         # 1
    text = case_fold(text)              # 2
    tokens = tokenize(text)             # 3
    tokens = remove_stopwords(tokens)   # 4
    tokens = stem_tokens(tokens)        # 5
    return join_tokens(tokens)          # 6


def preprocess_batch(texts: list[str]) -> list[str]:
    return [preprocess(t) for t in texts]
