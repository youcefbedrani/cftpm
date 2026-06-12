// Browser-side API layer. Talks to the Next.js /api routes (which talk to Postgres).
// The function signatures are kept the same as the previous Supabase version so
// components don't need to change.

async function call(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include',
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    return { error: (data && data.error) || `HTTP ${res.status}` };
  }
  return data || {};
}

// ============== INITIAL LOAD ==============
export async function fetchAll() {
  const r = await call('/api/bootstrap');
  if (r.error) {
    return { profiles: [], requests: [], enrollments: [], courseInstructors: [],
             lessons: [], lessonProgress: [], announcements: [], messages: [],
             payments: [], meetingInvitations: [] };
  }
  return r;
}

export async function fetchMe() {
  const r = await call('/api/auth/me');
  return r.user || null;
}

// ============== AUTH ==============
export async function signupStudent({ name, email, password, phone = '', wilaya = '' }) {
  return call('/api/auth/signup', { method: 'POST', body: { name, email, password, phone, wilaya } });
}
export async function loginUser({ email, password }) {
  return call('/api/auth/login', { method: 'POST', body: { email, password } });
}
export async function logoutUser() {
  return call('/api/auth/logout', { method: 'POST' });
}
export async function updateProfile(_email, patch) {
  return call('/api/auth/profile', { method: 'PUT', body: patch });
}

// ============== ENROLLMENT ==============
export async function createEnrollment({ course, phone, wilaya, motivation }) {
  return call('/api/enrollments', {
    method: 'POST',
    body: { courseId: course.id, courseTitle: course.title, amount: course.price, phone, wilaya, motivation },
  });
}

// ============== REQUESTS ==============
export async function createRequest({ topic, level, message }) {
  return call('/api/requests', { method: 'POST', body: { topic, level, message } });
}
export async function updateRequestStatus(id, status) {
  return call(`/api/requests/${id}`, { method: 'PUT', body: { status } });
}

// ============== ADMIN: USERS ==============
export async function createUserAsAdmin({ name, email, password, role, expertise = '', bio = '' }) {
  return call('/api/users', { method: 'POST', body: { name, email, password, role, expertise, bio } });
}
export async function setUserRole(email, role) {
  return call(`/api/users/${encodeURIComponent(email)}`, { method: 'PUT', body: { role } });
}
export async function deleteUser(email) {
  return call(`/api/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
}

// ============== COURSE INSTRUCTORS ==============
export async function assignInstructor(courseId, instructorEmail) {
  return call('/api/course-instructors', { method: 'POST', body: { courseId, instructorEmail } });
}
export async function unassignInstructor(courseId, instructorEmail) {
  return call('/api/course-instructors/unassign', { method: 'POST', body: { courseId, instructorEmail } });
}

// ============== LESSONS ==============
export async function createLesson(payload) {
  return call('/api/lessons', { method: 'POST', body: payload });
}
export async function updateLesson(id, patch) {
  return call(`/api/lessons/${id}`, { method: 'PUT', body: patch });
}
export async function deleteLesson(id) {
  return call(`/api/lessons/${id}`, { method: 'DELETE' });
}

// ============== LESSON PROGRESS ==============
export async function markLessonComplete({ lessonId, courseId }) {
  return call('/api/lesson-progress', { method: 'POST', body: { lessonId, courseId } });
}
export async function unmarkLessonComplete({ lessonId }) {
  return call(`/api/lesson-progress?lessonId=${encodeURIComponent(lessonId)}`, { method: 'DELETE' });
}

// ============== ANNOUNCEMENTS ==============
export async function createAnnouncement({ courseId, title, body }) {
  return call('/api/announcements', { method: 'POST', body: { courseId, title, body } });
}
export async function deleteAnnouncement(id) {
  return call(`/api/announcements/${id}`, { method: 'DELETE' });
}

// ============== MESSAGES ==============
export async function sendMessage({ courseId, toEmail, body }) {
  return call('/api/messages', { method: 'POST', body: { courseId, toEmail, body } });
}

// ============== MEETING INVITATIONS ==============
export async function createMeetingInvitation({ courseId, title, description, meetingDate, meetingLink }) {
  return call('/api/meeting-invitations', { method: 'POST', body: { courseId, title, description, meetingDate, meetingLink } });
}
export async function deleteMeetingInvitation(id) {
  return call(`/api/meeting-invitations/${id}`, { method: 'DELETE' });
}

// ============== PAYMENTS / INVOICES ==============
export async function fetchPayments() {
  return call('/api/payments');
}
export async function createSlickPayInvoice(data) {
  return call('/api/slickpay/create-invoice', { method: 'POST', body: data });
}
