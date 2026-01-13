// Debug script untuk memeriksa koneksi database dan user
require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl: process.env.DB_SSL === "true",
});

async function debugDatabase() {
  console.log("\n=== Database Debug ===\n");
  console.log("Connection Config:");
  console.log("  Host:", process.env.DB_HOST);
  console.log("  User:", process.env.DB_USER);
  console.log("  Database:", process.env.DB_NAME);
  console.log("  Port:", process.env.DB_PORT);

  try {
    // Test connection
    const client = await pool.connect();
    console.log("\n✓ Database connection successful!\n");

    // Check table structure
    const tableCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    if (tableCheck.rows.length === 0) {
      console.log('✗ Table "users" does not exist!\n');
    } else {
      console.log('Table "users" columns:');
      tableCheck.rows.forEach((row) => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    }

    // Check users - using correct column names
    const usersResult = await client.query("SELECT id, nama, email, role, LEFT(password, 20) as pwd_preview FROM users");
    console.log("\n=== Users in database ===");
    if (usersResult.rows.length === 0) {
      console.log("  (No users found - you need to create users first!)");
    } else {
      usersResult.rows.forEach((user) => {
        console.log(`  - ID: ${user.id}`);
        console.log(`    Nama: ${user.nama}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Role: ${user.role}`);
        console.log(`    Password hash: ${user.pwd_preview}...`);
        console.log("");
      });
    }

    client.release();
    console.log("=== Debug Complete ===\n");
  } catch (error) {
    console.error("\n✗ Database Error:", error.message);
  } finally {
    await pool.end();
  }
}

debugDatabase();
