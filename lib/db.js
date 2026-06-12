// Server-only Postgres pool. Must never be imported from a client component.
import { Pool } from 'pg';
import { resolve4 } from 'dns/promises';

const SSL = process.env.DATABASE_USE_SSL === 'true'
  ? { rejectUnauthorized: false }
  : false;

let poolPromise = null;

async function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  const parsed = new URL(url);
  let host = parsed.hostname;
  const port = parseInt(parsed.port, 10) || 5432;
  const database = parsed.pathname.replace(/^\//, '');
  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);

  try {
    const addrs = await resolve4(host);
    if (addrs.length) host = addrs[0];
  } catch {
    // fallback to hostname
  }

  return new Pool({ host, port, database, user, password, max: 10, idleTimeoutMillis: 30_000, ssl: SSL });
}

function ensurePool() {
  if (!poolPromise) poolPromise = createPool();
  return poolPromise;
}

// Intentionally an unsettled Promise — callers must await before using.
// The enrollments route imports this and must handle it appropriately.
export const pool = ensurePool();

export async function q(text, params = []) {
  const p = await ensurePool();
  if (!p) throw new Error('DATABASE_URL is not set. Did you copy .env.example to .env?');
  const res = await p.query(text, params);
  return res.rows;
}

export async function q1(text, params = []) {
  const rows = await q(text, params);
  return rows[0] || null;
}
