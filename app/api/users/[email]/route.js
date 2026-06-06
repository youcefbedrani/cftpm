import { withAuth, ok, bad } from '@/lib/authServer';
import { q, q1 } from '@/lib/db';
import { p2app } from '@/lib/rowMaps';

// Admin: change role
export const PUT = withAuth(async (req, { params }) => {
  const email = decodeURIComponent(params.email);
  const { role } = await req.json();
  if (!['student', 'formateur', 'admin'].includes(role)) return bad('bad role');
  const row = await q1('UPDATE profiles SET role = $1 WHERE email = $2 RETURNING *', [role, email]);
  if (!row) return bad('notfound', 404);
  return ok({ user: p2app(row) });
}, { roles: ['admin'] });

// Admin: delete user (cascades indirectly — their enrollments etc stay as historical rows)
export const DELETE = withAuth(async (_req, { params }) => {
  const email = decodeURIComponent(params.email);
  await q('DELETE FROM profiles WHERE email = $1', [email]);
  return ok({ ok: true });
}, { roles: ['admin'] });
