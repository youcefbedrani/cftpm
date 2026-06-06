import { getSessionUser } from '@/lib/authServer';
import { q1 } from '@/lib/db';
import { p2app } from '@/lib/rowMaps';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ user: null });
  const row = await q1('SELECT * FROM profiles WHERE email = $1', [session.email]);
  return NextResponse.json({ user: p2app(row) });
}
