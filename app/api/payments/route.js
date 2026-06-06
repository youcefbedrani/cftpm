import { withAuth, ok } from '@/lib/authServer';
import { q } from '@/lib/db';
import { pay2app } from '@/lib/rowMaps';

export const GET = withAuth(async (req, { session }) => {
  if (session.role === 'admin') {
    const rows = await q('SELECT * FROM payments ORDER BY created_at DESC');
    return ok({ payments: rows.map(pay2app) });
  }
  const rows = await q('SELECT * FROM payments WHERE user_email = $1 ORDER BY created_at DESC', [session.email]);
  return ok({ payments: rows.map(pay2app) });
});