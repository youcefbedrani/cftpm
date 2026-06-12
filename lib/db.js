// Server-only Postgres pool. Must never be imported from a client component.
import { Pool } from 'pg';

// NOTE: We do NOT throw at module level here because Next.js imports this
// during build (for API route analysis) when DATABASE_URL may not be set yet.
// The pool is created lazily — q() / q1() will throw if DATABASE_URL is missing.

const ssl = process.env.DATABASE_USE_SSL === 'true'
  ? { rejectUnauthorized: false }
  : false;

function initPool() {
  if (!process.env.DATABASE_URL) return null;
  const g = globalThis;
  if (g.__cftmp_pool) return g.__cftmp_pool;
  g.__cftmp_pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    ssl,
  });
  return g.__cftmp_pool;
}

function requirePool() {
  const p = initPool();
  if (!p) throw new Error('DATABASE_URL is not set. Did you copy .env.example to .env?');
  return p;
}

// Direct access to the underlying Pool (used by enrollments route for transactions).
// May be null during build — callers MUST only use it inside request handlers.
export const pool = initPool();

export async function q(text, params = []) {
  const p = requirePool();
  const res = await p.query(text, params);
  return res.rows;
}

export async function q1(text, params = []) {
  const rows = await q(text, params);
  return rows[0] || null;
}
