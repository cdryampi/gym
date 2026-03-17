import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load root .env.local
const rootPath = path.resolve(__dirname, '../../../../');
dotenv.config({ path: path.join(rootPath, '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'medusa-media';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

async function run() {
  console.log('Connecting to Supabase Storage at', SUPABASE_URL);

  // 1. Create bucket if not exists
  console.log(`Checking if bucket '${BUCKET_NAME}' exists...`);
  const bucketListRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });

  if (!bucketListRes.ok) {
    console.error('Failed to fetch buckets:', await bucketListRes.text());
    return;
  }

  const buckets = await bucketListRes.json();
  const bucketExists = buckets.some((b: any) => b.name === BUCKET_NAME);

  if (!bucketExists) {
    console.log(`Bucket '${BUCKET_NAME}' not found. Creating as public bucket...`);
    const createBucketRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: BUCKET_NAME,
            name: BUCKET_NAME,
            public: true,
            file_size_limit: 5242880,
            allowed_mime_types: ['image/png', 'image/jpeg', 'image/webp']
        })
    });

    if (!createBucketRes.ok) {
        console.error('Failed to create bucket:', await createBucketRes.text());
        return;
    }
    console.log(`Bucket '${BUCKET_NAME}' created successfully.`);
  } else {
    // Ensure it's public just in case
    await fetch(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET_NAME}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public: true })
    });
    console.log(`Bucket '${BUCKET_NAME}' exists and is ready.`);
  }

  // 2. Read images
  const imagesDir = path.join(rootPath, 'public/images/products');
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png'));

  console.log(`Found ${files.length} images to upload.`);

  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const fileBuffer = fs.readFileSync(filePath);

    console.log(`Uploading ${file}...`);
    
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${file}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'image/png',
      },
      body: fileBuffer,
    });

    if (uploadRes.status === 400 || uploadRes.status === 409) {
        const errJson: any = await uploadRes.json().catch(() => ({}));
        if (errJson.statusCode === '409' || errJson.error === 'Duplicate') {
            const updateRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${file}`, {
                method: 'PUT',
                headers: {
                Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'image/png',
                },
                body: fileBuffer,
            });
            if (updateRes.ok) {
                console.log(`✅ Updated ${file}`);
            } else {
                console.error(`❌ Failed to update ${file}:`, await updateRes.text());
            }
        } else {
            console.error(`❌ Failed to upload ${file}:`, errJson);
        }
    } else if (!uploadRes.ok) {
      console.error(`❌ Failed to upload ${file}:`, await uploadRes.text());
    } else {
      console.log(`✅ Uploaded ${file}`);
    }
  }

  console.log('Done uploading images!');
}

run().catch(console.error);
