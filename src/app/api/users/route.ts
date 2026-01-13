import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET - Fetch all users
export async function GET() {
  try {
    const result = await pool.query("SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at DESC");
    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: Request) {
  try {
    const { username, password, full_name, role } = await request.json();

    // Validate input
    if (!username || !password || !full_name || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await pool.query("SELECT id FROM users WHERE username = $1", [username]);

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    // Hash password
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query("INSERT INTO users (username, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, username, full_name, role, created_at", [username, hashedPassword, full_name, role]);

    return NextResponse.json({ user: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
