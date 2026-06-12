// Create an enrollment + update the user's enrolled_ids in one transaction.
// IMPORTANT: in production you'd verify the payment with SlickPay's webhook
// before allowing this to succeed. This route trusts the client (demo behavior).
import { withAuth, ok, bad } from '@/lib/authServer';
import { pool } from '@/lib/db';
import { p2app, e2app, pay2app } from '@/lib/rowMaps';

export const POST = withAuth(async (req, { session }) => {
  const { courseId, courseTitle, amount, phone = '', wilaya = '', motivation = '' } = await req.json();
  if (!courseId || !courseTitle || !amount) return bad('missing fields');
  const db = await pool;
  if (!db) return bad('Database not configured', 500);

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const me = (await client.query('SELECT * FROM profiles WHERE email = $1', [session.email])).rows[0];
    if (!me) { await client.query('ROLLBACK'); return bad('user gone', 404); }

    const enrolled = me.enrolled_ids || [];
    if (enrolled.includes(Number(courseId))) {
      await client.query('ROLLBACK');
      return bad('already enrolled', 409);
    }

    const enrollment = (await client.query(
      `INSERT INTO enrollments (course_id, course_title, user_email, user_name, phone, wilaya, motivation, amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [Number(courseId), courseTitle, me.email, me.name, phone, wilaya, motivation, Number(amount)]
    )).rows[0];

    const newIds = [...enrolled, Number(courseId)];
    const updated = (await client.query(
      'UPDATE profiles SET enrolled_ids = $1 WHERE email = $2 RETURNING *',
      [JSON.stringify(newIds), me.email]
    )).rows[0];

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const payment = (await client.query(
      `INSERT INTO payments (enrollment_id, invoice_number, amount, status, payment_method, user_email, user_name, course_id, course_title)
       VALUES ($1, $2, $3, 'completed', 'SlickPay', $4, $5, $6, $7) RETURNING *`,
      [enrollment.id, invoiceNumber, Number(amount), me.email, me.name, Number(courseId), courseTitle]
    )).rows[0];

    await client.query('COMMIT');
    return ok({ enrollment: e2app(enrollment), user: p2app(updated), payment: pay2app(payment) });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});
