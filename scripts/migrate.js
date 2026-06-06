// Run: `npm run db:migrate`
// Reads sql_migration.sql and executes it against $DATABASE_URL.
// Safe to re-run — the SQL drops & recreates every table.

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Did you copy .env.example to .env?');
    process.exit(1);
  }
  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql_migration.sql'), 'utf8');
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration done.');
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
