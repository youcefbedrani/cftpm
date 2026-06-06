// Server-only auth helpers. Imported by /app/api/**/route.js, never by client.
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'cftmp_session';
const SESSION_HOURS = 24 * 7; // 7 days

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error('AUTH_SECRET must be set and at least 32 chars. See .env.example.');
  }
  return new TextEncoder().encode(s);
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export async function issueSession(res, user) {
  const token = await new SignJWT({ sub: user.email, role: user.role, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret());

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  });
}

export function clearSession(res) {
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
}

// Returns { email, role, name } or null
export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { email: payload.sub, role: payload.role, name: payload.name };
  } catch {
    return null;
  }
}

// Higher-order helper for route handlers. Usage:
//   export const GET = withAuth(async (req, { session }) => { ... }, { roles: ['admin'] });
export function withAuth(handler, { roles } = {}) {
  return async (req, ctx) => {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (roles && !roles.includes(session.role)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    try {
      return await handler(req, { ...ctx, session });
    } catch (e) {
      console.error('Route error', e);
      return NextResponse.json({ error: e.message || 'server error' }, { status: 500 });
    }
  };
}

export function ok(data, init) {
  return NextResponse.json(data, init);
}
export function bad(msg, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}
