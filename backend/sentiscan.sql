-- Sentiscan — Skema MySQL
-- Aplikasi Analisis Sentimen Ulasan Smartphone Tokopedia
-- Perbandingan Naïve Bayes vs K-Nearest Neighbor (KNN)

-- Database (jalankan terpisah jika belum dibuat)
-- CREATE DATABASE sentiscan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE sentiscan;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS experiments;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS datasets;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────── USERS ───────────────────────────
CREATE TABLE users (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    email           VARCHAR(190) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(120) NOT NULL,
    role            ENUM('analis', 'pelanggan', 'admin') DEFAULT 'pelanggan',
    institution     VARCHAR(190),
    nim             VARCHAR(50),
    photo_url       VARCHAR(255),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────── DATASETS ───────────────────────────
CREATE TABLE datasets (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT NOT NULL,
    name            VARCHAR(190) NOT NULL,
    source          ENUM('scrape', 'upload', 'customer') NOT NULL,
    source_url      VARCHAR(500),
    total_reviews   INT DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_datasets_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────── REVIEWS ───────────────────────────
CREATE TABLE reviews (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    dataset_id      INT NOT NULL,
    user_id         INT NULL,  -- diisi jika ulasan dari customer login
    product_name    VARCHAR(255),
    brand           VARCHAR(80),
    review_text     TEXT NOT NULL,
    rating          TINYINT,
    label           ENUM('positif', 'negatif') NULL,
    clean_text      TEXT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_reviews_dataset (dataset_id),
    INDEX idx_reviews_label (label),
    INDEX idx_reviews_product (product_name),
    FULLTEXT INDEX ft_reviews_text (review_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────── EXPERIMENTS ───────────────────────────
CREATE TABLE experiments (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT NOT NULL,
    dataset_id      INT NOT NULL,
    name            VARCHAR(190),
    test_size       DECIMAL(3,2) DEFAULT 0.20,
    knn_k           INT DEFAULT 5,
    nb_metrics      JSON,
    knn_metrics     JSON,
    best_algorithm  ENUM('naive_bayes', 'knn') NOT NULL,
    duration_sec    DECIMAL(6,2),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    INDEX idx_exp_user (user_id),
    INDEX idx_exp_dataset (dataset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────── SEED ───────────────────────────
-- Akun demo (password = 'demo123' bcrypt)
-- Hash di bawah adalah contoh; seeder Python akan generate yang benar.

INSERT INTO users (email, password_hash, name, role, institution, nim)
VALUES
('demo@analis.com',     '$2b$12$placeholder.gunakan.app.seed', 'Rizky Pratama',  'analis',    'Universitas Indonesia', '1906356121'),
('demo@pelanggan.com',  '$2b$12$placeholder.gunakan.app.seed', 'Sari Wijaya',    'pelanggan', NULL, NULL);

-- Catatan: jalankan `python -m app.seed` untuk mengisi hash bcrypt yang benar
-- dan menambahkan dataset + ulasan contoh.
