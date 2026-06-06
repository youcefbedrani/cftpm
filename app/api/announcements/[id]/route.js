import { withAuth, ok, bad } from '@/lib/authServer';
import { q, q1 } from '@/lib/db';

// Author of the announcement, or admin, can delete.
export const DELETE = withAuth(async (_req, { params, session }) => {
  const a = await q1('SELECT * FROM announcements WHERE id = $1', [params.id]);
  if (!a) return bad('notfound', 404);
  if (session.role !== 'admin' && a.author_email !== session.email) return bad('forbidden', 403);
  await q('DELETE FROM announcements WHERE id = $1', [params.id]);
  return ok({ ok: true });
}, { roles: ['admin', 'formateur'] });
