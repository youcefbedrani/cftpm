import { withAuth, ok, bad } from '@/lib/authServer';
import { q1 } from '@/lib/db';
import { r2app } from '@/lib/rowMaps';

// Any signed-in user can submit a request.
export const POST = withAuth(async (req, { session }) => {
  const { topic, level = 'Beginner', message = '' } = await req.json();
  if (!topic) return bad('missing topic');
  const row = await q1(
    `INSERT INTO requests (topic, level, message, user_email, user_name)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [topic, level, message, session.email, session.name]
  );
  return ok({ request: r2app(row) });
});
