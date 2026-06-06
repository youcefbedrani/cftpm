import { withAuth, hashPassword, ok, bad } from '@/lib/authServer';
import { q1 } from '@/lib/db';
import { p2app } from '@/lib/rowMaps';

export const PUT = withAuth(async (req, { session }) => {
  const body = await req.json();
  const set = [], vals = [];
  let i = 1;
  const map = { name: 'name', phone: 'phone', wilaya: 'wilaya', bio: 'bio', expertise: 'expertise' };
  for (const [k, col] of Object.entries(map)) {
    if (body[k] !== undefined) { set.push(`${col} = $${i++}`); vals.push(body[k]); }
  }
  if (body.password) {
    if (body.password.length < 6) return bad('password too short');
    set.push(`password_hash = $${i++}`); vals.push(await hashPassword(body.password));
  }
  if (set.length === 0) return bad('nothing to update');
  vals.push(session.email);
  const row = await q1(`UPDATE profiles SET ${set.join(', ')} WHERE email = $${i} RETURNING *`, vals);
  return ok({ user: p2app(row) });
});
