// Run: `npm run db:seed`
// Creates initial accounts for all roles.
// Safe to re-run — uses ON CONFLICT (upsert).

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const ACCOUNTS = [
  {
    email: process.env.ADMIN_EMAIL    || 'admin@cftmp.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@2026',
    name: process.env.ADMIN_NAME     || 'CFTMP Admin',
    role: 'admin',
  },
  {
    email: 'formateur@cftmp.com',
    password: 'Formateur@2026',
    name: 'Ahmed Formateur',
    role: 'formateur',
  },
  {
    email: 'student@cftmp.com',
    password: 'Student@2026',
    name: 'Samir Student',
    role: 'student',
  },
];

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const ssl = process.env.DATABASE_USE_SSL === 'true'
    ? { rejectUnauthorized: true }
    : false;
  const client = new Client({ connectionString: url, ssl });
  await client.connect();
  try {
    for (const acc of ACCOUNTS) {
      const hash = await bcrypt.hash(acc.password, 10);
      await client.query(
        `INSERT INTO profiles (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email)
         DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
        [acc.name, acc.email, hash, acc.role]
      );
      console.log(`Seeded ${acc.role}: ${acc.email}`);
    }
  } catch (e) {
    console.error('Seed failed:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
