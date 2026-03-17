import type { Product } from "@/data/types";
import {
  mapListField,
  mapSpecifications,
  resolveRootProductCategory,
  type StoreCategory,
} from "@/lib/data/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DBProduct } from "@/lib/supabase/database.types";
import { getStoreCategories, getStoreProducts } from "@/lib/supabase/queries";


function mapSupabaseProduct(product: DBProduct, categories: StoreCategory[]): Product {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    eyebrow: product.eyebrow ?? undefined,
    category: resolveRootProductCategory(product.category_id, categories, product.category),
    short_description: product.short_description,
    description: product.description,
    price: product.price,
    compare_price: product.compare_price,
    discount_label: product.discount_label ?? undefined,
    currency: product.currency,
    stock_status: product.stock_status,
    pickup_only: product.pickup_only,
    pickup_note: product.pickup_note ?? undefined,
    pickup_summary: product.pickup_summary ?? undefined,
    pickup_eta: product.pickup_eta ?? undefined,
    featured: product.featured,
    images: mapListField(product.images),
    tags: mapListField(product.tags),
    highlights: mapListField(product.highlights),
    benefits: mapListField(product.benefits),
    usage_steps: mapListField(product.usage_steps),
    specifications: mapSpecifications(product.specifications),
    options: undefined,
    variants: undefined,
    cta_label: product.cta_label,
    order: product.order,
    active: product.active,
  };
}

export async function getSupabaseCommerceProducts(): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  const [products, categories] = await Promise.all([
    getStoreProducts(supabase),
    getStoreCategories(supabase),
  ]);

  return products.map((product) => mapSupabaseProduct(product, categories));
}
