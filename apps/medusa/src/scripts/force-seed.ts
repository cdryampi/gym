import pg from "pg";
import dotenv from "dotenv";
import path from "path";

const rootPath = path.resolve(__dirname, "../../../../");
dotenv.config({ path: path.join(rootPath, ".env.local") });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "Missing DATABASE_URL. Define it in apps/medusa/.env or the root .env.local before running force-seed.",
  );
}

async function run() {
  const { Client } = pg;
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to DB");

    console.log("Ensuring medusa-media bucket...");
    await client.query(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('medusa-media', 'medusa-media', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']::text[])
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);

    const productImages = [
      { handle: "creatina-nova-forza-monohidratada", images: ["product-1.png", "product-2.png"] },
      { handle: "proteina-isowhey-premium", images: ["product-2.png"] },
      { handle: "pre-entreno-nova-forza-explosive", images: ["product-3.png", "product-4.png"] },
      { handle: "shaker-pro-elite-700ml", images: ["product-5.png"] },
      { handle: "camiseta-tecnica-over-nova-forza", images: ["product-6.png"] },
      { handle: "straps-profesionales-agarre", images: ["product-7.png"] },
      { handle: "cinturon-powerlifting-cuero", images: ["product-8.png"] },
    ];

    const baseUrl = "https://nbjkfyjeewprnxxibhwz.supabase.co/storage/v1/object/public/medusa-media";

    console.log("Updating product images in DB...");
    for (const item of productImages) {
      const prodRes = await client.query("SELECT id FROM product WHERE handle = $1", [item.handle]);

      if (prodRes.rows.length === 0) {
        console.log(`Product ${item.handle} not found, skipping.`);
        continue;
      }

      const productId = prodRes.rows[0].id;

      for (const imgName of item.images) {
        const url = `${baseUrl}/${imgName}`;

        const imgRes = await client.query(
          `
            INSERT INTO product_image (url)
            VALUES ($1)
            ON CONFLICT (url) DO UPDATE SET url = EXCLUDED.url
            RETURNING id
          `,
          [url],
        );
        const imageId = imgRes.rows[0].id;

        await client.query(
          `
            INSERT INTO product_images (product_id, image_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `,
          [productId, imageId],
        );

        if (imgName === item.images[0]) {
          await client.query("UPDATE product SET thumbnail = $1 WHERE id = $2", [url, productId]);
        }
      }

      console.log(`Updated ${item.handle}`);
    }

    console.log("DB adaptation complete.");
  } catch (error) {
    console.error("Error during direct DB update:", error);
  } finally {
    await client.end();
  }
}

run();
