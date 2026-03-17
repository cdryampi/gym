import { Client } from "pg";
import dotenv from "dotenv";
import path from "path";

const rootPath = path.resolve(__dirname, "../../../../");
dotenv.config({ path: path.join(rootPath, ".env.local") });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "Missing DATABASE_URL. Define it in apps/medusa/.env or the root .env.local before running verify-seed.",
  );
}

async function run() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected.");

    const result = await client.query(`
      SELECT p.title, p.handle, count(pi.url) as image_count, array_agg(pi.url) as image_urls
      FROM product p
      LEFT JOIN product_image pi ON pi.id IN (
        SELECT image_id FROM product_images WHERE product_id = p.id
      )
      GROUP BY p.id, p.title, p.handle
      LIMIT 10;
    `);

    console.log("Products found:", JSON.stringify(result.rows, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error:", message);
  } finally {
    await client.end();
  }
}

run();
