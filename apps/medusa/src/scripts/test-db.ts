import { Client } from "pg";
import dotenv from "dotenv";
import path from "path";

const rootPath = path.resolve(__dirname, "../../../../");
dotenv.config({ path: path.join(rootPath, ".env.local") });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "Missing DATABASE_URL. Define it in apps/medusa/.env or the root .env.local before running test-db.",
  );
}

async function run() {
  console.log("Testing connection to:", dbUrl.replace(/:[^:]*@/, ":****@"));

  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("Connected successfully to the database.");

    const result = await client.query("SELECT current_database(), current_user");
    console.log("Result:", result.rows[0]);

    console.log("Ensuring bucket medusa-media...");
    await client.query(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('medusa-media', 'medusa-media', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']::text[])
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    console.log("Bucket ensured.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Connection failed:", message);
  } finally {
    await client.end();
  }
}

run();
