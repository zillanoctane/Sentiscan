# Sentiscan Backend

Backend FastAPI + MySQL untuk aplikasi Analisis Sentimen Ulasan Smartphone Tokopedia.
Membandingkan algoritma **Naïve Bayes** dan **K-Nearest Neighbor (KNN)**.

## Stack

- **Python** 3.11+
- **FastAPI** + Uvicorn
- **MySQL** 8.0+ (via SQLAlchemy + PyMySQL)
- **scikit-learn** untuk Naïve Bayes & KNN
- **Sastrawi** untuk stemming + stopword Bahasa Indonesia
- **JWT** untuk autentikasi
- **BeautifulSoup + Requests** untuk scraping

## 1. Setup Database MySQL

Buka MySQL (XAMPP / phpMyAdmin / mysql CLI), lalu jalankan:

```sql
CREATE DATABASE sentiscan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sentiscan'@'localhost' IDENTIFIED BY 'sentiscan123';
GRANT ALL PRIVILEGES ON sentiscan.* TO 'sentiscan'@'localhost';
FLUSH PRIVILEGES;
```

Atau gunakan akun `root` Anda sendiri. Lalu impor skema:

```bash
mysql -u sentiscan -p sentiscan < sentiscan.sql
```

## 2. Install dependencies

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
```

## 3. Konfigurasi .env

Salin `.env.example` ke `.env` lalu sesuaikan:

```env
DATABASE_URL=mysql+pymysql://sentiscan:sentiscan123@localhost:3306/sentiscan
JWT_SECRET=ganti-dengan-string-acak-panjang
JWT_EXPIRES_MINUTES=120
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000
```

## 4. Jalankan server

```bash
uvicorn app.main:app --reload --port 8001
```

API tersedia di `http://localhost:8001`
Dokumentasi interaktif: `http://localhost:8001/docs`

## 5. Akun seed

Setelah server jalan pertama kali, jalankan seeder:

```bash
python -m app.seed
```

Membuat 2 akun demo:
- `demo@analis.com` / `demo123` (role: analis)
- `demo@pelanggan.com` / `demo123` (role: pelanggan)

## 6. Hubungkan ke frontend

Frontend (file HTML di root project) bisa dijalankan dengan:

```bash
# dari root project (bukan dari backend/):
python -m http.server 8000
```

Atau pakai VS Code Live Server.

Lalu buka `http://localhost:8000/index.html`.

## Endpoint utama

| Method | Path | Deskripsi |
|---|---|---|
| POST | `/api/auth/register` | Daftar akun baru |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Info user aktif |
| POST | `/api/datasets/scrape` | Scrape ulasan dari URL Tokopedia |
| POST | `/api/datasets/upload` | Upload CSV ulasan |
| GET | `/api/datasets` | Daftar dataset milik user |
| GET | `/api/datasets/{id}/reviews` | Ulasan dalam dataset (paginated) |
| PATCH | `/api/datasets/{id}/reviews/{rid}` | Edit ulasan / label |
| DELETE | `/api/datasets/{id}/reviews/{rid}` | Hapus ulasan |
| POST | `/api/datasets/{id}/auto-label` | Auto-label dari rating |
| POST | `/api/preprocessing/run` | Jalankan praproses |
| GET | `/api/preprocessing/preview` | Preview before/after |
| POST | `/api/modeling/train` | Latih NB + KNN, simpan eksperimen |
| POST | `/api/modeling/predict` | Prediksi teks bebas (NB + KNN) |
| GET | `/api/results/experiments` | Riwayat eksperimen |
| GET | `/api/results/experiments/{id}` | Detail eksperimen |
| GET | `/api/results/experiments/{id}/export` | Export CSV/PDF |
| POST | `/api/reviews/customer` | Pelanggan kirim ulasan |

## Struktur folder

```
backend/
├── app/
│   ├── main.py             # entrypoint FastAPI
│   ├── config.py           # settings dari .env
│   ├── database.py         # SQLAlchemy engine + session
│   ├── auth.py             # JWT + bcrypt
│   ├── seed.py             # buat akun demo
│   ├── models/             # SQLAlchemy ORM
│   ├── schemas/            # Pydantic request/response
│   ├── routers/            # endpoint per modul
│   └── services/           # logika ML & scraping
├── sentiscan.sql           # skema MySQL
├── requirements.txt
└── .env.example
```

## Troubleshooting

**`Access denied for user 'sentiscan'`** — cek password di `.env` cocok dengan yang dibuat di MySQL.

**`ModuleNotFoundError: No module named 'Sastrawi'`** — install ulang: `pip install Sastrawi==1.0.1`.

**`CORS error` di browser** — tambahkan URL frontend ke `CORS_ORIGINS` di `.env`.

**Scraping Tokopedia gagal** — struktur HTML Tokopedia berubah-ubah. Pakai jalur upload CSV sebagai cadangan utama (PRD Bagian 10).
