const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const client = new Client({
  host: "localhost",
  user: "postgres",
  password: "postgres",
  database: "servis",
  port: 5432,
});

async function main() {
  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected!");

    // 1. Cek tabel users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role VARCHAR(20) NOT NULL
      );
    `);

    // 2. Cek user admin
    const res = await client.query("SELECT * FROM users WHERE username = 'admin'");
    if (res.rows.length === 0) {
      console.log("Admin user not found. Creating...");
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("password_admin", salt);

      await client.query("INSERT INTO users (username, password, full_name, role) VALUES ($1, $2, $3, $4)", ["admin", hash, "Admin Utama", "admin"]);
      console.log("Admin user created (username: admin, password: password_admin)");
    } else {
      console.log("Admin user already exists.");
    }
  } catch (err) {
    console.error("Database error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
