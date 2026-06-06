import { withAuth, ok, bad } from '@/lib/authServer';
import { q, q1 } from '@/lib/db';

export const DELETE = withAuth(async (_req, { params, session }) => {
  const inv = await q1('SELECT * FROM meeting_invitations WHERE id = $1', [params.id]);
  if (!inv) return bad('notfound', 404);
  if (session.role !== 'admin' && inv.created_by_email !== session.email) return bad('forbidden', 403);
  await q('DELETE FROM meeting_invitations WHERE id = $1', [params.id]);
  return ok({ ok: true });
}, { roles: ['admin', 'formateur'] });