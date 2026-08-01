// Run: node lib/db-init.js
// Creates tables and seeds a default admin: admin / admin123
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log("Creating tables...");

  // Each flat can have an owner AND/OR a tenant (two rows per flat max)
  await db.execute(`CREATE TABLE IF NOT EXISTS members (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    block       TEXT NOT NULL,
    flat_no     TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'owner',   -- 'owner' | 'tenant'
    name        TEXT NOT NULL,
    mobile      TEXT,
    dob         TEXT,
    address     TEXT,
    photo_url   TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now')),
    UNIQUE(block, flat_no, role)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  )`);

  const hash = await bcrypt.hash("admin123", 12);
  await db.execute({
    sql: `INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)`,
    args: ["admin", hash],
  });

  console.log("✅ Database ready! Default admin: admin / admin123");
  console.log("   New schema: each flat supports both owner + tenant rows");
  console.log("⚠️  Change the password after first login!");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
