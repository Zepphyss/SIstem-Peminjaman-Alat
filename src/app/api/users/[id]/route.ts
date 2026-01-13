import { NextResponse } from "next/server";
import pool from "@/lib/db";

// DELETE - Delete user
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if user exists
    const existingUser = await pool.query("SELECT id, role FROM users WHERE id = $1", [id]);

    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting the last admin
    if (existingUser.rows[0].role === "admin") {
      const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return NextResponse.json({ error: "Cannot delete the last admin user" }, { status: 400 });
      }
    }

    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { username, full_name, role, password } = await request.json();

    // Check if user exists
    const existingUser = await pool.query("SELECT id FROM users WHERE id = $1", [id]);

    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if new username already exists (for another user)
    if (username) {
      const usernameCheck = await pool.query("SELECT id FROM users WHERE username = $1 AND id != $2", [username, id]);
      if (usernameCheck.rows.length > 0) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 });
      }
    }

    // Build update query dynamically
    let updateQuery = "UPDATE users SET ";
    const updateValues: (string | undefined)[] = [];
    let paramIndex = 1;

    if (username) {
      updateQuery += `username = $${paramIndex}, `;
      updateValues.push(username);
      paramIndex++;
    }
    if (full_name) {
      updateQuery += `full_name = $${paramIndex}, `;
      updateValues.push(full_name);
      paramIndex++;
    }
    if (role) {
      updateQuery += `role = $${paramIndex}, `;
      updateValues.push(role);
      paramIndex++;
    }
    if (password) {
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += `password = $${paramIndex}, `;
      updateValues.push(hashedPassword);
      paramIndex++;
    }

    // Remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, username, full_name, role, created_at`;
    updateValues.push(id);

    const result = await pool.query(updateQuery, updateValues);

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
