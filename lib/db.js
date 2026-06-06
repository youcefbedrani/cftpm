// Server-only Postgres pool. Must never be imported from a client component.
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Did you copy .env.example to .env?');
}

// Reuse one pool across hot-reloads in dev
const g = globalThis;
export const pool =
  g.__cftmp_pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
if (!g.__cftmp_pool) g.__cftmp_pool = pool;

export async function q(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows;
}

export async function q1(text, params = []) {
  const rows = await q(text, params);
  return rows[0] || null;
}
