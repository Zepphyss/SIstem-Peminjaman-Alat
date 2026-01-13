import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

// GET - Fetch single user by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const result = await pool.query("SELECT id, nama as username, email, role, created_at FROM users WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Gagal mengambil data user" }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { username, email, role, password } = await request.json();

    // Check if user exists
    const existingUser = await pool.query("SELECT id FROM users WHERE id = $1", [id]);

    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Check if new nama already exists (for another user)
    if (username) {
      const namaCheck = await pool.query("SELECT id FROM users WHERE nama = $1 AND id != $2", [username, id]);
      if (namaCheck.rows.length > 0) {
        return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
      }
    }

    // Check if new email already exists (for another user)
    if (email) {
      const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [email, id]);
      if (emailCheck.rows.length > 0) {
        return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 });
      }
    }

    // Build update query dynamically
    let updateQuery = "UPDATE users SET ";
    const updateValues: string[] = [];
    let paramIndex = 1;

    if (username) {
      updateQuery += `nama = $${paramIndex}, `;
      updateValues.push(username);
      paramIndex++;
    }
    if (email) {
      updateQuery += `email = $${paramIndex}, `;
      updateValues.push(email);
      paramIndex++;
    }
    if (role) {
      updateQuery += `role = $${paramIndex}, `;
      updateValues.push(role);
      paramIndex++;
    }
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += `password = $${paramIndex}, `;
      updateValues.push(hashedPassword);
      paramIndex++;
    }

    if (updateValues.length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diupdate" }, { status: 400 });
    }

    // Remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, nama as username, email, role, created_at`;
    updateValues.push(id);

    const result = await pool.query(updateQuery, updateValues);

    return NextResponse.json({ user: result.rows[0], message: "User berhasil diupdate" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Gagal mengupdate user" }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if user exists
    const existingUser = await pool.query("SELECT id, role FROM users WHERE id = $1", [id]);

    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Prevent deleting the last admin
    if (existingUser.rows[0].role === "admin") {
      const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return NextResponse.json({ error: "Tidak dapat menghapus admin terakhir" }, { status: 400 });
      }
    }

    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    return NextResponse.json({ message: "User berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Gagal menghapus user" }, { status: 500 });
  }
}
