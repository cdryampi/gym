import type { ProductCategory, ProductSpecification, ProductStockStatus } from "@/data/types";

export interface MedusaAdminCategoryMetadata {
  order?: number | null;
}

export interface MedusaAdminCategory {
  id: string;
  name?: string | null;
  description?: string | null;
  handle?: string | null;
  is_active?: boolean | null;
  rank?: number | null;
  parent_category_id?: string | null;
  parent_category?: {
    id: string;
  } | null;
  metadata?: MedusaAdminCategoryMetadata | null;
}

export interface MedusaAdminMoneyAmount {
  amount?: number | null;
  currency_code?: string | null;
}

export interface MedusaAdminProductVariant {
  id: string;
  title?: string | null;
  sku?: string | null;
  inventory_quantity?: number | null;
  prices?: MedusaAdminMoneyAmount[] | null;
}

export interface MedusaAdminProductCategoryRef {
  id: string;
  name?: string | null;
  handle?: string | null;
  parent_category_id?: string | null;
}

export interface MedusaAdminProductImage {
  id?: string | null;
  url?: string | null;
}

export interface MedusaAdminProductTag {
  id?: string | null;
  value?: string | null;
}

export interface MedusaAdminProductMetadata {
  benefits?: string[] | null;
  category?: ProductCategory | null;
  compare_price?: number | null;
  cta_label?: string | null;
  discount_label?: string | null;
  eyebrow?: string | null;
  featured?: boolean | null;
  highlights?: string[] | null;
  order?: number | null;
  paypal_price_usd?: number | null;
  pickup_eta?: string | null;
  pickup_note?: string | null;
  pickup_only?: boolean | null;
  pickup_summary?: string | null;
  short_description?: string | null;
  specifications?: ProductSpecification[] | null;
  stock_status?: ProductStockStatus | null;
  storefront_images?: string[] | null;
  tags?: string[] | null;
  usage_steps?: string[] | null;
}

export interface MedusaAdminProduct {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  handle?: string | null;
  status?: string | null;
  metadata?: MedusaAdminProductMetadata | null;
  variants?: MedusaAdminProductVariant[] | null;
  categories?: MedusaAdminProductCategoryRef[] | null;
  images?: MedusaAdminProductImage[] | null;
  tags?: MedusaAdminProductTag[] | null;
}

export interface MedusaAdminShippingProfile {
  id: string;
  type?: string | null;
  name?: string | null;
}
