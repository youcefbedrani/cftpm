// Returns everything the SPA needs after login, scoped by role:
//   - admin / formateur: all rows for the tables they need
//   - student: only their own enrollments + progress + relevant announcements/messages
//   - anonymous: empty payload (the public site doesn't need it)
import { getSessionUser } from '@/lib/authServer';
import { q } from '@/lib/db';
import { NextResponse } from 'next/server';
import { p2app, r2app, e2app, ci2app, l2app, lp2app, a2app, m2app, pay2app, mi2app } from '@/lib/rowMaps';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({
      profiles: [], requests: [], enrollments: [], courseInstructors: [],
      lessons: [], lessonProgress: [], announcements: [], messages: [],
      payments: [], meetingInvitations: [],
    });
  }

  const courseInstructors = (await q('SELECT * FROM course_instructors')).map(ci2app);
  const lessons           = (await q('SELECT * FROM lessons ORDER BY course_id, order_num')).map(l2app);

  if (session.role === 'admin') {
    const [profiles, requests, enrollments, lessonProgress, announcements, messages, payments, meetingInvitations] = await Promise.all([
      q('SELECT * FROM profiles ORDER BY created_at DESC').then(r => r.map(p2app)),
      q('SELECT * FROM requests ORDER BY created_at DESC').then(r => r.map(r2app)),
      q('SELECT * FROM enrollments ORDER BY paid_at DESC').then(r => r.map(e2app)),
      q('SELECT * FROM lesson_progress').then(r => r.map(lp2app)),
      q('SELECT * FROM announcements ORDER BY created_at DESC').then(r => r.map(a2app)),
      q('SELECT * FROM messages ORDER BY created_at ASC').then(r => r.map(m2app)),
      q('SELECT * FROM payments ORDER BY created_at DESC').then(r => r.map(pay2app)),
      q('SELECT * FROM meeting_invitations ORDER BY created_at DESC').then(r => r.map(mi2app)),
    ]);
    return NextResponse.json({ profiles, requests, enrollments, courseInstructors, lessons, lessonProgress, announcements, messages, payments, meetingInvitations });
  }

  if (session.role === 'formateur') {
    const myCourseIds = courseInstructors
      .filter(ci => ci.instructorEmail === session.email)
      .map(ci => ci.courseId);
    const inList = myCourseIds.length ? myCourseIds : [0];
    const [profiles, enrollments, lessonProgress, announcements, messages, payments, meetingInvitations] = await Promise.all([
      q(`SELECT DISTINCT p.* FROM profiles p
         JOIN enrollments e ON e.user_email = p.email
         WHERE e.course_id = ANY($1::int[])`, [inList]).then(r => r.map(p2app)),
      q(`SELECT * FROM enrollments WHERE course_id = ANY($1::int[]) ORDER BY paid_at DESC`, [inList]).then(r => r.map(e2app)),
      q(`SELECT * FROM lesson_progress WHERE course_id = ANY($1::int[])`, [inList]).then(r => r.map(lp2app)),
      q(`SELECT * FROM announcements WHERE course_id = ANY($1::int[]) ORDER BY created_at DESC`, [inList]).then(r => r.map(a2app)),
      q(`SELECT * FROM messages WHERE course_id = ANY($1::int[]) AND (to_email = $2 OR from_email = $2) ORDER BY created_at ASC`,
         [inList, session.email]).then(r => r.map(m2app)),
      q(`SELECT * FROM payments WHERE course_id = ANY($1::int[]) ORDER BY created_at DESC`, [inList]).then(r => r.map(pay2app)),
      q(`SELECT * FROM meeting_invitations WHERE course_id = ANY($1::int[]) ORDER BY created_at DESC`, [inList]).then(r => r.map(mi2app)),
    ]);
    return NextResponse.json({ profiles, requests: [], enrollments, courseInstructors, lessons, lessonProgress, announcements, messages, payments, meetingInvitations });
  }

  const me      = (await q('SELECT * FROM profiles WHERE email = $1', [session.email])).map(p2app);
  const myIds   = me[0]?.enrolledIds || [];
  const ids     = myIds.length ? myIds : [0];
  const instructorEmails = courseInstructors.filter(ci => myIds.includes(ci.courseId)).map(ci => ci.instructorEmail);
  const profiles = instructorEmails.length
    ? (await q('SELECT * FROM profiles WHERE email = ANY($1::text[])', [instructorEmails])).map(p2app)
    : [];

  const [enrollments, lessonProgress, announcements, messages, payments, meetingInvitations] = await Promise.all([
    q('SELECT * FROM enrollments WHERE user_email = $1 ORDER BY paid_at DESC', [session.email]).then(r => r.map(e2app)),
    q('SELECT * FROM lesson_progress WHERE user_email = $1', [session.email]).then(r => r.map(lp2app)),
    q('SELECT * FROM announcements WHERE course_id = ANY($1::int[]) ORDER BY created_at DESC', [ids]).then(r => r.map(a2app)),
    q('SELECT * FROM messages WHERE course_id = ANY($1::int[]) AND (to_email = $2 OR from_email = $2) ORDER BY created_at ASC',
       [ids, session.email]).then(r => r.map(m2app)),
    q('SELECT * FROM payments WHERE user_email = $1 ORDER BY created_at DESC', [session.email]).then(r => r.map(pay2app)),
    q('SELECT * FROM meeting_invitations WHERE course_id = ANY($1::int[]) ORDER BY created_at DESC', [ids]).then(r => r.map(mi2app)),
  ]);

  return NextResponse.json({
    profiles: [...me, ...profiles],
    requests: [], enrollments, courseInstructors, lessons, lessonProgress, announcements, messages, payments, meetingInvitations,
  });
}
