// db.js
import pg from "pg";
const { Pool } = pg;

const db = new Pool({
  host:     process.env.DB_HOST,      // aws-0-eu-west-1.pooler.supabase.com
  port:     6543,                     // Pooler uses 6543, not 5432
  database: "postgres",
  user:     process.env.DB_USER,      // postgres.rudyodirvyaojgtfwzsr
  password: process.env.DB_PASSWORD,
  ssl:      { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

db.on("error", (err) => {
  console.error("Unexpected PG pool error:", err);
});

export default db;