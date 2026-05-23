# Sentiscan

Aplikasi analisis sentimen ulasan produk smartphone di Tokopedia,
membandingkan algoritma Naïve Bayes dan KNN.

## Teknologi

- **Frontend:** HTML + React (via Babel standalone), tanpa proses build.
- **Backend:** Python + FastAPI.
- **Database:** MySQL.

## Cara Menjalankan

### 1. Database
Nyalakan MySQL (mis. lewat XAMPP). Buat database lalu impor skema:

```sql
CREATE DATABASE sentiscan;
```

```bash
mysql -u root -p sentiscan < backend/sentiscan.sql
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
```

Salin `.env.example` menjadi `.env`, lalu sesuaikan kredensial database
dan isi `JWT_SECRET` dengan string acak yang panjang.

```bash
copy .env.example .env         # Windows
# cp .env.example .env         # macOS / Linux
```

Jalankan server:

```bash
uvicorn app.main:app --reload --port 8001
```

Buat akun demo (sekali saja):

```bash
python -m app.seed
```

### 3. Frontend

Dari folder utama proyek (bukan folder `backend`):

```bash
python -m http.server 8000
```

### 4. Buka di browser

```
http://localhost:8000/login.html
```

## Catatan

- Backend berjalan di port **8001**, frontend di port **8000**.
- File `.env` berisi data rahasia dan tidak disertakan di repository.
  Gunakan `.env.example` sebagai acuan.
- Folder `venv` tidak disertakan; buat ulang dari `requirements.txt`.
