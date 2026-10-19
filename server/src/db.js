import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Copy .env.example to .env and fill it in.");
}

const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);

// One shared pool of database connections for the whole server.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }, // Supabase requires SSL
  max: 5,
});

// Shortcut for simple one-off queries: const { rows } = await query("select ...", [params])
export function query(text, params) {
  return pool.query(text, params);
}

// Run several queries as one all-or-nothing transaction.
// Used when two people might grab the last ticket at the same moment.
export async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
