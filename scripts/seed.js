// Run: `npm run db:seed`
// Inserts (or updates) the initial admin user from $ADMIN_EMAIL/$ADMIN_PASSWORD/$ADMIN_NAME.
// Safe to re-run.

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }
  const email = process.env.ADMIN_EMAIL    || 'admin@cftmp.com';
  const name  = process.env.ADMIN_NAME     || 'CFTMP Admin';
  const pass  = process.env.ADMIN_PASSWORD;
  if (!pass) {
    console.error('ADMIN_PASSWORD is required.');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const hash = await bcrypt.hash(pass, 10);
    await client.query(
      `INSERT INTO profiles (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email)
       DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = 'admin'`,
      [name, email, hash]
    );
    console.log(`Seeded admin: ${email}`);
  } catch (e) {
    console.error('Seed failed:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
