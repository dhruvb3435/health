#!/usr/bin/env node
const { Client } = require('pg');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node activate_user.js user@example.com');
    process.exit(2);
  }

  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true' || false,
  });

  try {
    await client.connect();
    console.log('Connected to DB', process.env.DATABASE_HOST, process.env.DATABASE_NAME);

    const colRes = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='users'"
    );
    const cols = colRes.rows.map((r) => r.column_name);

    let emailCol = null;
    if (cols.includes('emailverified') || cols.includes('emailVerified')) {
      // information_schema returns lowercase for unquoted identifiers
      emailCol = '"emailVerified"';
    } else if (cols.includes('email_verified')) {
      emailCol = 'email_verified';
    }

    let updateSQL;
    if (emailCol) {
      updateSQL = `UPDATE users SET status='active', ${emailCol}=true WHERE email=$1`;
    } else {
      updateSQL = `UPDATE users SET status='active' WHERE email=$1`;
    }

    const res = await client.query(updateSQL, [email]);
    console.log('Updated rows:', res.rowCount);
    if (res.rowCount === 0) {
      console.error('No user found with that email.');
    } else {
      console.log('User activated and emailVerified set (if column present).');
    }
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
