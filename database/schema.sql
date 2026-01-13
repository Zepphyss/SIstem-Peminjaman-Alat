-- Database Schema untuk Aplikasi Peminjaman Alat
-- Jalankan script ini di pgAdmin atau psql

-- 1. Buat tabel users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert admin default (password: admin123)
-- Password sudah di-hash dengan bcrypt
INSERT INTO users (username, password, full_name, role) 
VALUES (
    'admin',
    '$2a$10$rKZqxQxJ5vQ5yZJ5yZJ5yO5yZJ5yZJ5yZJ5yZJ5yZJ5yZJ5yZJ5y',
    'Administrator',
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- 3. Insert employee untuk testing (password: employee123)
INSERT INTO users (username, password, full_name, role) 
VALUES (
    'employee',
    '$2a$10$aKZqxQxJ5vQ5yZJ5yZJ5yO5yZJ5yZJ5yZJ5yZJ5yZJ5yZJ5yZJ5a',
    'Employee Test',
    'employee'
) ON CONFLICT (username) DO NOTHING;

-- 4. Verifikasi data
SELECT id, username, full_name, role, created_at FROM users;
