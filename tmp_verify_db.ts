import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

async function verify() {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT name, slug, price FROM public.products LIMIT 20');
    console.log('--- PRODUCT DATA IN DB ---');
    console.table(res.rows);
    const count = await client.query('SELECT count(*) FROM public.products');
    console.log(`Total count: ${count.rows[0].count}`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

verify();
