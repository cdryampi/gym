import { cache } from "react";

import { getDashboardCapabilities } from "@/lib/auth";
import {
  mapDashboardProduct,
  mapListField,
  mapSpecifications,
  resolveRootProductCategory,
  type StoreDashboardProduct,
} from "@/lib/data/store";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getStoreCategories, getStoreCategoryById, getStoreProducts } from "@/lib/supabase/queries";
import { type StoreCategory } from "@/lib/data/store";
import { hasSupabasePublicEnv } from "@/lib/env";
import { type DBProduct } from "@/lib/supabase/database.types";


function mapProductRecord(product: DBProduct, categories: StoreCategory[]): StoreDashboardProduct {
  const rootCategory = resolveRootProductCategory(product.category_id, categories, product.category);

  return mapDashboardProduct(product, categories, {
    id: product.id,
    slug: product.slug,
    name: product.name,
    eyebrow: product.eyebrow ?? undefined,
    category: rootCategory,
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
  });
}

async function getDashboardSupabaseReader() {
  const capabilities = await getDashboardCapabilities();

  if (capabilities.canManageRealData) {
    return createSupabaseAdminClient();
  }

  return createSupabaseServerClient();
}

export const getStoreAdminSnapshot = cache(async () => {
  if (!hasSupabasePublicEnv()) {
    return {
      categories: [] as StoreCategory[],
      products: [] as StoreDashboardProduct[],
      warning: "Supabase no esta configurado. La tienda interna no puede cargar datos reales.",
    };
  }

  const supabase = await getDashboardSupabaseReader();
  const [categories, products] = await Promise.all([
    getStoreCategories(supabase, { includeInactive: true }),
    getStoreProducts(supabase, { includeInactive: true }),
  ]);

  return {
    categories,
    products: products.map((product) => mapProductRecord(product, categories)),
    warning: null as string | null,
  };
});

export async function getStoreAdminCategory(id: string) {
  const supabase = await getDashboardSupabaseReader();
  return getStoreCategoryById(supabase, id);
}

export async function getStoreAdminProduct(id: string) {
  const snapshot = await getStoreAdminSnapshot();
  return snapshot.products.find((product) => product.id === id) ?? null;
}
