import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, fullName } = body;

    // Validasi input
    if (!username || !password || !fullName) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 });
    }

    // Validasi panjang password
    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    // Cek apakah username sudah ada
    const existingUser = await pool.query("SELECT id FROM users WHERE username = $1", [username]);

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user baru dengan role 'employee'
    const result = await pool.query("INSERT INTO users (username, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, username, full_name, role", [username, hashedPassword, fullName, "employee"]);

    const newUser = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        message: "Registrasi berhasil! Silakan login.",
        user: {
          id: newUser.id,
          username: newUser.username,
          fullName: newUser.full_name,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
