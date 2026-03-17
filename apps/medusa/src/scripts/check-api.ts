import dotenv from 'dotenv';
import path from 'path';

const rootPath = path.resolve(__dirname, '../../../../');
dotenv.config({ path: path.join(rootPath, '.env.local') });

async function test() {
  const backendUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
  const publishableKey = process.env.MEDUSA_PUBLISHABLE_KEY;
  const regionId = process.env.MEDUSA_REGION_ID;
  
  const url = new URL('/store/products', backendUrl);
  url.searchParams.set('fields', '*variants.calculated_price,+variants.inventory_quantity,+tags,+metadata,*categories,*collection,+images,+thumbnail,+subtitle,+status');
  if (regionId) {
      url.searchParams.set('region_id', regionId);
  }

  console.log('Fetching:', url.toString());
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-publishable-api-key': publishableKey || ''
      }
    });
    console.log('Status:', response.status);
    const text = await response.text();
    if (response.ok) {
        const data = JSON.parse(text);
        console.log('Products found:', data.products?.length);
        if (data.products && data.products.length > 0) {
            const p = data.products[0];
            console.log('Title:', p.title);
            console.log('Metadata images:', p.metadata?.storefront_images);
            console.log('Thumbnail:', p.thumbnail);
        }
    } else {
        console.error('Error Body:', text);
    }
  } catch (err) {
    console.error('Fetch Error:', err.message);
  }
}
test();
