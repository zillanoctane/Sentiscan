"""Scraper Tokopedia untuk ulasan produk smartphone.

⚠️ CATATAN PENTING (PRD 6.1 & 10):
Struktur HTML Tokopedia berubah-ubah dan biasanya menggunakan JavaScript
untuk merender ulasan. Scraper berbasis BeautifulSoup ini berupaya parsing
GraphQL-shaped JSON dari halaman; jika gagal, raise SkripsiScrapeError dengan
saran fallback ke upload CSV.

Untuk produksi, pertimbangkan Selenium / Playwright.
"""
import re
import json
import time
from dataclasses import dataclass
from typing import Optional

import requests
from bs4 import BeautifulSoup

from ..config import settings


class ScrapeError(Exception):
    """Dilempar jika scraping gagal. Pesan ditampilkan ke user."""
    pass


@dataclass
class ScrapedReview:
    review_text: str
    rating: Optional[int]
    product_name: str
    brand: Optional[str] = None


# Pola ekstraksi produk dari URL Tokopedia
# Contoh: https://www.tokopedia.com/galeri-smartphone/iphone-15-pro-max-256gb
TOKOPEDIA_URL_RE = re.compile(r"https?://(?:www\.)?tokopedia\.com/[\w\-]+/([\w\-]+)")


def _http_get(url: str) -> requests.Response:
    headers = {
        "User-Agent": settings.SCRAPER_USER_AGENT,
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
    }
    return requests.get(url, headers=headers, timeout=settings.SCRAPER_TIMEOUT_SEC)


def _extract_product_name(url: str, soup: BeautifulSoup) -> str:
    # Cari <h1> dengan judul produk
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        return h1.get_text(strip=True)
    # Fallback ke slug URL
    m = TOKOPEDIA_URL_RE.search(url)
    if m:
        return m.group(1).replace("-", " ").title()
    return "Produk Tokopedia"


def _parse_reviews_from_json(soup: BeautifulSoup) -> list[dict]:
    """Coba ekstrak ulasan dari blob JSON (Next.js __NEXT_DATA__ atau apollo state)."""
    candidates = []
    for script in soup.find_all("script"):
        s = script.string or ""
        if not s:
            continue
        if "reviewText" in s or "productReviewList" in s:
            candidates.append(s)
    reviews = []
    for s in candidates:
        try:
            # Cari objek-objek review berbasis regex sederhana
            for m in re.finditer(
                r'\{"reviewText":"([^"]+)"[^}]*"productRating":(\d)',
                s,
            ):
                reviews.append({"reviewText": m.group(1), "rating": int(m.group(2))})
        except Exception:
            continue
    return reviews


def scrape_tokopedia_product(url: str, max_reviews: int = 500) -> list[ScrapedReview]:
    """Scrape ulasan dari URL produk Tokopedia.

    Raises:
        ScrapeError: jika halaman tidak bisa di-parse / diblokir / kosong.
    """
    if not TOKOPEDIA_URL_RE.match(url):
        raise ScrapeError("URL bukan halaman produk Tokopedia yang valid.")

    try:
        resp = _http_get(url)
    except requests.RequestException as e:
        raise ScrapeError(f"Gagal terhubung ke Tokopedia: {e}. Coba upload CSV.")

    if resp.status_code >= 400:
        raise ScrapeError(
            f"Tokopedia mengembalikan status {resp.status_code}. "
            "Halaman mungkin diblokir bot detector. Silakan unggah CSV."
        )

    soup = BeautifulSoup(resp.text, "lxml")
    product_name = _extract_product_name(url, soup)

    raw_reviews = _parse_reviews_from_json(soup)
    if not raw_reviews:
        raise ScrapeError(
            "Struktur halaman Tokopedia berubah dan ulasan tidak terdeteksi. "
            "Silakan unggah file CSV dengan kolom 'review_text, rating'."
        )

    scraped = []
    for r in raw_reviews[:max_reviews]:
        text = r.get("reviewText", "").strip()
        if not text:
            continue
        scraped.append(ScrapedReview(
            review_text=text,
            rating=int(r.get("rating")) if r.get("rating") else None,
            product_name=product_name,
        ))
    if not scraped:
        raise ScrapeError("Tidak ada ulasan valid yang ditemukan pada halaman produk.")

    return scraped
