"""Seeder: buat akun demo + dataset contoh.

Jalankan setelah server pertama kali start (tabel sudah dibuat):
    python -m app.seed
"""
from .auth import hash_password
from .database import Base, SessionLocal, engine
from .models import User, Dataset, Review


SAMPLE_REVIEWS = [
    ("Barangnya bagus, pengiriman cepat banget mantap!", 5, "iPhone 15 Pro Max 256GB", "Apple", "positif"),
    ("Kualitas mengecewakan, baterai cepat habis dan layar bergaris.", 1, "iPhone 14 128GB", "Apple", "negatif"),
    ("Harga bersaing, packing rapi, recommended seller!", 5, "Samsung Galaxy A55 5G 8/256", "Samsung", "positif"),
    ("Lama banget pengirimannya, barang sampai dalam keadaan rusak.", 1, "Xiaomi Redmi Note 13 Pro", "Xiaomi", "negatif"),
    ("Sinyal kuat, kamera jernih, performa lancar buat gaming.", 5, "POCO X6 Pro 5G", "POCO", "positif"),
    ("Boros baterai, sering hang, panas saat dipakai.", 2, "OPPO A78 8/256", "OPPO", "negatif"),
    ("Original, fast charging mantap, build quality premium.", 5, "Vivo V30 Pro 5G", "Vivo", "positif"),
    ("Tidak sesuai deskripsi, charger tidak berfungsi normal.", 1, "Realme 12 Pro+", "Realme", "negatif"),
    ("Speaker stereo enak, layar terang, fingerprint cepat.", 5, "Samsung Galaxy S24 Ultra", "Samsung", "positif"),
    ("Sayang sekali ada cacat di layar pojok kanan atas.", 2, "Xiaomi 14 12/512", "Xiaomi", "negatif"),
    ("Mantap, garansi resmi lengkap segel masih utuh.", 5, "iPhone 15 Pro Max 256GB", "Apple", "positif"),
    ("Kemasan rusak parah, segel sudah terbuka mencurigakan.", 1, "Infinix Note 40 Pro", "Infinix", "negatif"),
    ("Worth it, fitur AI berguna sekali untuk fotografi.", 5, "Vivo V30 Pro 5G", "Vivo", "positif"),
    ("Sering restart sendiri, susah dapat sinyal 4G.", 2, "Tecno Camon 30 Pro", "Tecno", "negatif"),
    ("Lengkap, respon penjual ramah dan cepat tanggap.", 5, "Nothing Phone (2a)", "Nothing", "positif"),
    ("Sinyal lemot, kamera blur, hasilnya pecah.", 1, "OPPO Reno 11 5G", "OPPO", "negatif"),
    ("Performa lancar, harga sesuai kualitas. Top!", 4, "Samsung Galaxy A55 5G 8/256", "Samsung", "positif"),
    ("Komplain dicuekin seller, refund please.", 1, "Vivo Y28 8/256", "Vivo", "negatif"),
    ("Build quality terasa premium, fast charging beneran cepat.", 5, "Xiaomi 14 12/512", "Xiaomi", "positif"),
    ("Bukan original alias rekondisi, sangat mengecewakan.", 1, "iPhone 14 128GB", "Apple", "negatif"),
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # ── Hapus seed lama (opsional) ─────────────────────
        existing = db.query(User).filter(User.email.in_(["demo@analis.com", "demo@pelanggan.com"])).all()
        for u in existing:
            db.delete(u)
        db.commit()

        # ── Akun demo ──────────────────────────────────────
        analis = User(
            email="demo@analis.com",
            password_hash=hash_password("demo123"),
            name="Rizky Pratama",
            role="analis",
            institution="Universitas Indonesia",
            nim="1906356121",
        )
        pelanggan = User(
            email="demo@pelanggan.com",
            password_hash=hash_password("demo123"),
            name="Sari Wijaya",
            role="pelanggan",
        )
        db.add_all([analis, pelanggan])
        db.flush()

        # ── Dataset contoh untuk analis ────────────────────
        ds = Dataset(
            user_id=analis.id,
            name="Dataset Contoh — 20 Ulasan Smartphone",
            source="upload",
            total_reviews=len(SAMPLE_REVIEWS),
        )
        db.add(ds)
        db.flush()

        for text, rating, product, brand, label in SAMPLE_REVIEWS:
            db.add(Review(
                dataset_id=ds.id,
                product_name=product,
                brand=brand,
                review_text=text,
                rating=rating,
                label=label,
            ))

        db.commit()
        print("✓ Seed berhasil.")
        print(f"  • Akun analis    : demo@analis.com    / demo123")
        print(f"  • Akun pelanggan : demo@pelanggan.com / demo123")
        print(f"  • Dataset contoh : #{ds.id} ({len(SAMPLE_REVIEWS)} ulasan terlabeli)")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
