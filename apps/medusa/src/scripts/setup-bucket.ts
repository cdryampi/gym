import { Client } from "pg";
import dotenv from "dotenv";
import path from "path";

const rootPath = path.resolve(__dirname, "../../../../");
dotenv.config({ path: path.join(rootPath, ".env.local") });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "Missing DATABASE_URL. Define it in apps/medusa/.env or the root .env.local before running setup-bucket.",
  );
}

async function run() {
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log("Connected to DB");

    await client.query(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('medusa-media', 'medusa-media', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']::text[])
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    console.log("Bucket medusa-media ensured.");

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Allow public uploads to medusa-media' AND tablename = 'objects' AND schemaname = 'storage'
        ) THEN
            CREATE POLICY "Allow public uploads to medusa-media"
            ON storage.objects FOR INSERT
            TO public
            WITH CHECK (bucket_id = 'medusa-media');
        END IF;
      END
      $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Allow public updates to medusa-media' AND tablename = 'objects' AND schemaname = 'storage'
        ) THEN
            CREATE POLICY "Allow public updates to medusa-media"
            ON storage.objects FOR UPDATE
            TO public
            USING (bucket_id = 'medusa-media');
        END IF;
      END
      $$;
    `);
    console.log("RLS policies established.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

run();
