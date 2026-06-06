import { withAuth, ok, bad } from '@/lib/authServer';
import { q1 } from '@/lib/db';
import { r2app } from '@/lib/rowMaps';

// Admin: update status
export const PUT = withAuth(async (req, { params }) => {
  const { status } = await req.json();
  if (!['pending', 'accepted', 'rejected'].includes(status)) return bad('bad status');
  const row = await q1('UPDATE requests SET status = $1 WHERE id = $2 RETURNING *', [status, params.id]);
  if (!row) return bad('notfound', 404);
  return ok({ request: r2app(row) });
}, { roles: ['admin'] });
