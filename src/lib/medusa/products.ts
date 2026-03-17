import type { HttpTypes } from "@medusajs/types";

import {
  MEDUSA_STOREFRONT_PRODUCT_FIELDS,
  getMedusaStorefrontConfig,
} from "@/lib/medusa/config";
import { getMedusaSdk } from "@/lib/medusa/sdk";

const MEDUSA_PRODUCT_LIMIT = 100;

function buildProductQuery() {
  const config = getMedusaStorefrontConfig();

  return {
    fields: MEDUSA_STOREFRONT_PRODUCT_FIELDS,
    limit: MEDUSA_PRODUCT_LIMIT,
    region_id: config.regionId,
    country_code: config.countryCode,
  } satisfies HttpTypes.StoreProductListParams;
}

export async function listMedusaStoreProducts() {
  const sdk = getMedusaSdk();
  const { products } = await sdk.store.product.list(buildProductQuery());
  return products;
}

export async function getMedusaStoreProductByHandle(handle: string) {
  const sdk = getMedusaSdk();
  const { products } = await sdk.store.product.list({
    ...buildProductQuery(),
    handle,
    limit: 1,
  });

  return products[0] ?? null;
}
