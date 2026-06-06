import { withAuth, ok, bad } from '@/lib/authServer';
import { q1 } from '@/lib/db';
import { a2app } from '@/lib/rowMaps';

// Post an announcement. Admin can post for any course; formateur only for their courses.
export const POST = withAuth(async (req, { session }) => {
  const { courseId, title, body } = await req.json();
  if (!courseId || !title || !body) return bad('missing fields');
  if (session.role !== 'admin') {
    const owns = await q1(
      'SELECT 1 FROM course_instructors WHERE course_id = $1 AND instructor_email = $2',
      [Number(courseId), session.email]
    );
    if (!owns) return bad('forbidden', 403);
  }
  const row = await q1(
    `INSERT INTO announcements (course_id, author_email, author_name, title, body)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [Number(courseId), session.email, session.name, title, body]
  );
  return ok({ announcement: a2app(row) });
}, { roles: ['admin', 'formateur'] });
