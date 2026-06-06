import { withAuth, ok, bad } from '@/lib/authServer';
import { q1 } from '@/lib/db';
import { m2app } from '@/lib/rowMaps';

// Send a message about a course.
// Students may only send to the assigned instructor of a course they're enrolled in.
// Formateurs may only send to students enrolled in a course they teach.
// Admin can send any.
export const POST = withAuth(async (req, { session }) => {
  const { courseId, toEmail, body } = await req.json();
  if (!courseId || !toEmail || !body) return bad('missing fields');

  if (session.role === 'student') {
    const ok1 = await q1(
      `SELECT 1 FROM enrollments e
       JOIN course_instructors ci ON ci.course_id = e.course_id
       WHERE e.course_id = $1 AND e.user_email = $2 AND ci.instructor_email = $3`,
      [Number(courseId), session.email, toEmail.toLowerCase()]
    );
    if (!ok1) return bad('not allowed for this course', 403);
  } else if (session.role === 'formateur') {
    const ok2 = await q1(
      `SELECT 1 FROM enrollments e
       JOIN course_instructors ci ON ci.course_id = e.course_id
       WHERE e.course_id = $1 AND e.user_email = $2 AND ci.instructor_email = $3`,
      [Number(courseId), toEmail.toLowerCase(), session.email]
    );
    if (!ok2) return bad('not allowed for this course', 403);
  }

  const row = await q1(
    `INSERT INTO messages (course_id, from_email, from_name, to_email, body)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [Number(courseId), session.email, session.name, toEmail.toLowerCase(), body]
  );
  return ok({ message: m2app(row) });
});
