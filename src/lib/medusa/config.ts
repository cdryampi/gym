import { getMedusaEnv } from "@/lib/env";

export const MEDUSA_STOREFRONT_PRODUCT_FIELDS = [
  "*collection",
  "*categories",
  "*images",
  "*tags",
  "*options",
  "*options.values",
  "*variants",
  "*variants.options",
  "*variants.options.option",
  "*variants.calculated_price",
  "+variants.inventory_quantity",
  "+metadata",
  "+subtitle",
  "+thumbnail",
  "+status",
].join(",");

export function getMedusaStorefrontConfig() {
  const env = getMedusaEnv();

  return {
    backendUrl: env.backendUrl,
    publishableKey: env.publishableKey,
    regionId: env.regionId,
    countryCode: env.countryCode,
    currencyCode: env.currencyCode,
  };
}
