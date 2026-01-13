import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validasi input
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password harus diisi" }, { status: 400 });
    }

    // Cari user di database berdasarkan email
    const result = await pool.query("SELECT id, nama, email, password, role FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const user = result.rows[0];

    // Verifikasi password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    // Generate JWT token
    // Note: signToken is now async
    const token = await signToken({
      userId: user.id,
      role: user.role,
    });

    // Buat response
    const response = NextResponse.json(
      {
        success: true,
        token: token,
        user: {
          id: user.id,
          username: user.nama,
          fullName: user.nama,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Set cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
