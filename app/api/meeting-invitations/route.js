import { withAuth, ok, bad } from '@/lib/authServer';
import { q, q1 } from '@/lib/db';
import { mi2app } from '@/lib/rowMaps';

export const POST = withAuth(async (req, { session }) => {
  const { courseId, title, description = '', meetingDate, meetingLink } = await req.json();
  if (!courseId || !title || !meetingDate || !meetingLink) return bad('missing fields');
  if (session.role !== 'admin') {
    const assigned = await q1(
      'SELECT 1 FROM course_instructors WHERE course_id = $1 AND instructor_email = $2',
      [Number(courseId), session.email]
    );
    if (!assigned) return bad('not your course', 403);
  }
  const row = await q1(
    `INSERT INTO meeting_invitations (course_id, title, description, meeting_date, meeting_link, created_by_email, created_by_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [Number(courseId), title, description, meetingDate, meetingLink, session.email, session.name]
  );
  return ok({ invitation: mi2app(row) });
}, { roles: ['admin', 'formateur'] });