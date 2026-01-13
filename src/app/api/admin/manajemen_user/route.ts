import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

// GET - Fetch all users
export async function GET() {
  try {
    // Database uses 'nama' column, but we return it as 'username' for frontend
    const result = await pool.query("SELECT id, nama as username, email, role, created_at FROM users ORDER BY created_at DESC");
    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Gagal mengambil data user" }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: Request) {
  try {
    const { username, email, password, role } = await request.json();

    // Validate input
    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    // Check if nama already exists
    const existingNama = await pool.query("SELECT id FROM users WHERE nama = $1", [username]);
    if (existingNama.rows.length > 0) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingEmail.rows.length > 0) {
      return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user - using 'nama' column in database
    const result = await pool.query("INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, nama as username, email, role, created_at", [username, email, hashedPassword, role]);

    return NextResponse.json({ user: result.rows[0], message: "User berhasil ditambahkan" }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Gagal membuat user" }, { status: 500 });
  }
}
