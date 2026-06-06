import { withAuth, ok, bad } from '@/lib/authServer';
import { q, q1 } from '@/lib/db';
import { l2app } from '@/lib/rowMaps';

async function canEdit(session, lessonId) {
  if (session.role === 'admin') return true;
  if (session.role !== 'formateur') return false;
  const row = await q1(
    `SELECT 1 FROM lessons l
     JOIN course_instructors ci ON ci.course_id = l.course_id
     WHERE l.id = $1 AND ci.instructor_email = $2`,
    [lessonId, session.email]
  );
  return !!row;
}

export const PUT = withAuth(async (req, { params, session }) => {
  if (!(await canEdit(session, params.id))) return bad('forbidden', 403);
  const body = await req.json();
  const set = [], vals = [];
  let i = 1;
  const map = { order: 'order_num', title: 'title', content: 'content', videoUrl: 'video_url', durationMin: 'duration_min' };
  for (const [k, col] of Object.entries(map)) {
    if (body[k] !== undefined) {
      const v = (col === 'order_num' || col === 'duration_min') ? Number(body[k]) || 0 : body[k];
      set.push(`${col} = $${i++}`); vals.push(v);
    }
  }
  if (set.length === 0) return bad('nothing to update');
  vals.push(params.id);
  const row = await q1(`UPDATE lessons SET ${set.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  return ok({ lesson: l2app(row) });
}, { roles: ['admin', 'formateur'] });

export const DELETE = withAuth(async (_req, { params, session }) => {
  if (!(await canEdit(session, params.id))) return bad('forbidden', 403);
  await q('DELETE FROM lessons WHERE id = $1', [params.id]);
  return ok({ ok: true });
}, { roles: ['admin', 'formateur'] });
