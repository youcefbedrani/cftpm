import { withAuth, hashPassword, ok, bad } from '@/lib/authServer';
import { q, q1 } from '@/lib/db';
import { p2app } from '@/lib/rowMaps';

// Admin: create a user (any role). Used for creating formateurs.
export const POST = withAuth(async (req) => {
  const { name, email, password, role = 'student', expertise = '', bio = '' } = await req.json();
  if (!name || !email || !password) return bad('missing fields');
  if (password.length < 6) return bad('password too short');
  if (!['student', 'formateur', 'admin'].includes(role)) return bad('bad role');

  const exists = await q1('SELECT email FROM profiles WHERE email = $1', [email.toLowerCase()]);
  if (exists) return bad('exists', 409);

  const hash = await hashPassword(password);
  const row = await q1(
    `INSERT INTO profiles (name, email, password_hash, role, expertise, bio)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, email.toLowerCase(), hash, role, expertise, bio]
  );
  return ok({ user: p2app(row) });
}, { roles: ['admin'] });
