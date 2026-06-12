import { q1 } from '@/lib/db';
import { verifyPassword, issueSession, bad } from '@/lib/authServer';
import { p2app } from '@/lib/rowMaps';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    let body;
    try { body = await req.json(); } catch { return bad('invalid body'); }
    const { email, password } = body || {};
    if (!email || !password) return bad('missing fields');

    const row = await q1('SELECT * FROM profiles WHERE email = $1', [email.toLowerCase()]);
    if (!row) return bad('notfound', 401);

    const okPass = await verifyPassword(password, row.password_hash);
    if (!okPass) return bad('notfound', 401);

    const user = p2app(row);
    const res = NextResponse.json({ user });
    await issueSession(res, user);
    return res;
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: e.message || 'Server error. Please try again.' }, { status: 500 });
  }
}
