import { withAuth, ok, bad } from '@/lib/authServer';
import { q1 } from '@/lib/db';
import { l2app } from '@/lib/rowMaps';

// Create a lesson. Allowed for admin, or for a formateur assigned to this course.
export const POST = withAuth(async (req, { session }) => {
  const { courseId, order, title, content = '', videoUrl = '', durationMin = 0 } = await req.json();
  if (!courseId || !title) return bad('missing fields');
  if (session.role !== 'admin') {
    const assigned = await q1(
      'SELECT 1 FROM course_instructors WHERE course_id = $1 AND instructor_email = $2',
      [Number(courseId), session.email]
    );
    if (!assigned) return bad('not your course', 403);
  }
  const row = await q1(
    `INSERT INTO lessons (course_id, order_num, title, content, video_url, duration_min, created_by_email)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [Number(courseId), Number(order) || 1, title, content, videoUrl, Number(durationMin) || 0, session.email]
  );
  return ok({ lesson: l2app(row) });
}, { roles: ['admin', 'formateur'] });
