import { withAuth, ok, bad } from '@/lib/authServer';
import { q } from '@/lib/db';

// DELETE-by-body is awkward via fetch; use POST with action semantics.
export const POST = withAuth(async (req) => {
  const { courseId, instructorEmail } = await req.json();
  if (!courseId || !instructorEmail) return bad('missing fields');
  await q('DELETE FROM course_instructors WHERE course_id = $1 AND instructor_email = $2',
          [Number(courseId), instructorEmail.toLowerCase()]);
  return ok({ ok: true });
}, { roles: ['admin'] });
