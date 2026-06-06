// Shared snake_case (Postgres) -> camelCase (app) row mappers.
// Used by API routes when returning JSON to the client.

export const p2app = (p) => p ? {
  id: p.id, name: p.name, email: p.email,
  role: p.role || 'student',
  phone: p.phone || '', wilaya: p.wilaya || '',
  bio: p.bio || '', expertise: p.expertise || '',
  enrolledIds: p.enrolled_ids || [], createdAt: p.created_at,
} : null;

export const r2app = (r) => r ? {
  id: r.id, topic: r.topic, level: r.level, message: r.message,
  userEmail: r.user_email, userName: r.user_name,
  status: r.status || 'pending', createdAt: r.created_at,
} : null;

export const e2app = (e) => e ? {
  id: e.id, courseId: e.course_id, courseTitle: e.course_title,
  userEmail: e.user_email, userName: e.user_name,
  phone: e.phone, wilaya: e.wilaya, motivation: e.motivation,
  amount: e.amount, paidAt: e.paid_at,
} : null;

export const l2app = (l) => l ? {
  id: l.id, courseId: l.course_id, order: l.order_num,
  title: l.title, content: l.content || '', videoUrl: l.video_url || '',
  durationMin: l.duration_min || 0, createdByEmail: l.created_by_email,
  createdAt: l.created_at,
} : null;

export const ci2app = (c) => c ? {
  id: c.id, courseId: c.course_id, instructorEmail: c.instructor_email, assignedAt: c.assigned_at,
} : null;

export const lp2app = (p) => p ? {
  id: p.id, userEmail: p.user_email, lessonId: p.lesson_id, courseId: p.course_id, completedAt: p.completed_at,
} : null;

export const a2app = (a) => a ? {
  id: a.id, courseId: a.course_id, authorEmail: a.author_email, authorName: a.author_name,
  title: a.title, body: a.body, createdAt: a.created_at,
} : null;

export const m2app = (m) => m ? {
  id: m.id, courseId: m.course_id, fromEmail: m.from_email, fromName: m.from_name,
  toEmail: m.to_email, body: m.body, read: m.read, createdAt: m.created_at,
} : null;

export const pay2app = (p) => p ? {
  id: p.id, enrollmentId: p.enrollment_id, invoiceNumber: p.invoice_number,
  amount: p.amount, currency: p.currency, status: p.status,
  paymentMethod: p.payment_method, userEmail: p.user_email, userName: p.user_name,
  courseId: p.course_id, courseTitle: p.course_title,
  createdAt: p.created_at, paidAt: p.paid_at,
} : null;

export const mi2app = (m) => m ? {
  id: m.id, courseId: m.course_id, title: m.title, description: m.description || '',
  meetingDate: m.meeting_date, meetingLink: m.meeting_link,
  createdByEmail: m.created_by_email, createdByName: m.created_by_name || '',
  createdAt: m.created_at,
} : null;
