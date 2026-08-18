import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL. Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS students CASCADE;');
    await client.query('DROP TABLE IF EXISTS admins CASCADE;');
    await client.query('DROP TABLE IF EXISTS fees CASCADE;');
    await client.query('DROP TABLE IF EXISTS staff CASCADE;');
    await client.query('DROP TABLE IF EXISTS notices CASCADE;');
    await client.query('DROP TABLE IF EXISTS complaints CASCADE;');
    await client.query('DROP TABLE IF EXISTS visitors CASCADE;');
    await client.query('DROP TABLE IF EXISTS activity_logs CASCADE;');
    console.log('Tables dropped successfully.');
  } catch (err) {
    console.error('Error dropping tables:', err.message);
  } finally {
    await client.end();
  }
}

run();
