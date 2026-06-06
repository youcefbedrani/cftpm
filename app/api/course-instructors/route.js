import { withAuth, ok, bad } from '@/lib/authServer';
import { q1 } from '@/lib/db';
import { ci2app } from '@/lib/rowMaps';

// Admin: assign instructor to course
export const POST = withAuth(async (req) => {
  const { courseId, instructorEmail } = await req.json();
  if (!courseId || !instructorEmail) return bad('missing fields');
  const row = await q1(
    `INSERT INTO course_instructors (course_id, instructor_email)
     VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
    [Number(courseId), instructorEmail.toLowerCase()]
  );
  if (!row) return bad('already assigned', 409);
  return ok({ row: ci2app(row) });
}, { roles: ['admin'] });
