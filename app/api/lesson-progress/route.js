import { withAuth, ok, bad } from '@/lib/authServer';
import { q, q1 } from '@/lib/db';
import { lp2app } from '@/lib/rowMaps';

// Mark complete (idempotent via UNIQUE constraint)
export const POST = withAuth(async (req, { session }) => {
  const { lessonId, courseId } = await req.json();
  if (!lessonId || !courseId) return bad('missing fields');
  const row = await q1(
    `INSERT INTO lesson_progress (user_email, lesson_id, course_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_email, lesson_id) DO UPDATE SET completed_at = lesson_progress.completed_at
     RETURNING *`,
    [session.email, lessonId, Number(courseId)]
  );
  return ok({ progress: lp2app(row) });
});

// Unmark
export const DELETE = withAuth(async (req, { session }) => {
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get('lessonId');
  if (!lessonId) return bad('missing lessonId');
  await q('DELETE FROM lesson_progress WHERE user_email = $1 AND lesson_id = $2', [session.email, lessonId]);
  return ok({ ok: true });
});
