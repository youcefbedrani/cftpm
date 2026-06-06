import { clearSession } from '@/lib/authServer';
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearSession(res);
  return res;
}
