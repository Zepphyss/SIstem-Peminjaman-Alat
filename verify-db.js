const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  user: "postgres",
  password: "postgres",
  database: "servis",
  port: 5432,
});

async function checkConnection() {
  try {
    await client.connect();
    console.log("Successfully connected to the database!");
    const res = await client.query("SELECT NOW()");
    console.log("Database time:", res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
}

checkConnection();
