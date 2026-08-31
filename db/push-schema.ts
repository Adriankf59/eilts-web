// Terapkan db/schema.sql ke database di DATABASE_URL. Idempoten (semua statement pakai
// IF NOT EXISTS), aman dijalankan ulang.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

process.loadEnvFile();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const sql = readFileSync(join(import.meta.dirname, "schema.sql"), "utf-8");
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }
  console.log(`Skema diterapkan: ${statements.length} statement.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
