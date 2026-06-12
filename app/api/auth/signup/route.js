import { q, q1 } from '@/lib/db';
import { hashPassword, issueSession, ok, bad } from '@/lib/authServer';
import { p2app } from '@/lib/rowMaps';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    let body;
    try { body = await req.json(); } catch { return bad('invalid body'); }
    const { name, email, password, phone = '', wilaya = '' } = body || {};
    if (!name || !email || !password) return bad('missing fields');
    if (password.length < 6)            return bad('password too short');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('bad email');

    const existing = await q1('SELECT email FROM profiles WHERE email = $1', [email.toLowerCase()]);
    if (existing) return bad('exists', 409);

    const hash = await hashPassword(password);
    const row = await q1(
      `INSERT INTO profiles (name, email, password_hash, role, phone, wilaya)
       VALUES ($1, $2, $3, 'student', $4, $5) RETURNING *`,
      [name, email.toLowerCase(), hash, phone, wilaya]
    );
    const user = p2app(row);
    const res = NextResponse.json({ user });
    await issueSession(res, user);
    return res;
  } catch (e) {
    console.error('Signup error:', e);
    return NextResponse.json({ error: e.message || 'Server error. Please try again.' }, { status: 500 });
  }
}
