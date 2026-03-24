import fs from "fs";
import type { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  updateProductCategoriesWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SyncCategory = {
  id: string;
  active: boolean;
  description: string | null;
  medusa_category_id: string | null;
  name: string;
  order: number;
  parent_id: string | null;
  slug: string;
};

type SyncProduct = {
  active: boolean;
  benefits: string[];
  category: string;
  category_id: string | null;
  compare_price: number | null;
  cta_label: string;
  currency: string;
  description: string;
  discount_label: string | null;
  eyebrow: string | null;
  featured: boolean;
  highlights: string[];
  id: string;
  images: string[];
  medusa_product_id: string | null;
  name: string;
  order: number;
  pickup_eta: string | null;
  pickup_note: string | null;
  pickup_only: boolean;
  pickup_summary: string | null;
  price: number;
  short_description: string;
  slug: string;
  specifications: Record<string, unknown>;
  stock_status: string;
  tags: string[];
  usage_steps: string[];
};

type SyncInput = {
  categories: SyncCategory[];
  products: SyncProduct[];
};

type SyncResultEntry = {
  action: string;
  handle: string;
  medusa_id: string;
  supabase_id: string;
};

type SyncOutput = {
  categories: SyncResultEntry[];
  products: SyncResultEntry[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readInput(inputPath: string): SyncInput {
  return JSON.parse(fs.readFileSync(inputPath, "utf8")) as SyncInput;
}

function writeOutput(outputPath: string, data: SyncOutput) {
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}

/** Topological sort: parents before children. */
function sortCategoriesByDependency(categories: SyncCategory[]): SyncCategory[] {
  const pending = new Map(categories.map((c) => [c.id, c]));
  const sorted: SyncCategory[] = [];

  while (pending.size > 0) {
    const ready = Array.from(pending.values())
      .filter((c) => !c.parent_id || sorted.some((s) => s.id === c.parent_id))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "es"));

    if (ready.length === 0) {
      throw new Error("Category tree has an unresolvable circular reference.");
    }

    for (const c of ready) {
      sorted.push(c);
      pending.delete(c.id);
    }
  }

  return sorted;
}

function toMinorUnits(amount: number): number {
  return Math.round(Number(amount || 0) * 100);
}

function toProductStatus(active: boolean) {
  return active ? ProductStatus.PUBLISHED : ProductStatus.DRAFT;
}

function buildSku(slug: string): string {
  return "SB-" + slug.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toUpperCase();
}

function buildProductMetadata(product: SyncProduct, existingPaypalPrice?: number) {
  // Preserve existing PayPal price if already set; fall back to PEN÷3.8 estimate.
  const paypalPrice =
    typeof existingPaypalPrice === "number" && existingPaypalPrice > 0
      ? existingPaypalPrice
      : Math.round((product.price / 3.8) * 100) / 100;

  return {
    benefits: product.benefits,
    category: product.category,
    compare_price: product.compare_price,
    cta_label: product.cta_label,
    discount_label: product.discount_label,
    eyebrow: product.eyebrow,
    featured: product.featured,
    highlights: product.highlights,
    order: product.order,
    paypal_price_usd: paypalPrice,
    pickup_eta: product.pickup_eta,
    pickup_note: product.pickup_note,
    pickup_only: product.pickup_only,
    pickup_summary: product.pickup_summary,
    short_description: product.short_description,
    specifications: product.specifications,
    stock_status: product.stock_status,
    storefront_images: product.images,
    supabase_product_id: product.id,
    tags: product.tags,
    usage_steps: product.usage_steps,
  };
}

// ---------------------------------------------------------------------------
// Category sync
// ---------------------------------------------------------------------------

async function syncCategories(
  container: ExecArgs["container"],
  categories: SyncCategory[],
  logger: { info(msg: string): void },
): Promise<{ results: SyncResultEntry[]; idMap: Map<string, string> }> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: existing = [] } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "name"],
  });

  type MedusaCategory = { id: string; handle?: string | null };
  const byHandle = new Map((existing as MedusaCategory[]).map((c) => [c.handle ?? "", c]));
  const byId = new Map((existing as MedusaCategory[]).map((c) => [c.id, c]));

  const idMap = new Map<string, string>(); // supabaseId → medusaId
  const results: SyncResultEntry[] = [];

  for (const category of sortCategoriesByDependency(categories)) {
    const parentMedusaId = category.parent_id ? (idMap.get(category.parent_id) ?? null) : null;
    const match =
      (category.medusa_category_id ? byId.get(category.medusa_category_id) : null) ??
      byHandle.get(category.slug) ??
      null;

    const payload = {
      description: category.description ?? undefined,
      handle: category.slug,
      is_active: category.active,
      metadata: { supabase_category_id: category.id },
      name: category.name,
      parent_category_id: parentMedusaId,
      rank: category.order,
    };

    if (match) {
      const { result } = await updateProductCategoriesWorkflow(container).run({
        input: { selector: { id: match.id }, update: payload },
      });
      const updated = result[0];
      idMap.set(category.id, updated.id);
      byHandle.set(category.slug, updated);
      byId.set(updated.id, updated);
      results.push({ action: "updated", handle: category.slug, medusa_id: updated.id, supabase_id: category.id });
      logger.info(`[sync] category updated: ${category.slug}`);
    } else {
      const { result } = await createProductCategoriesWorkflow(container).run({
        input: { product_categories: [payload] },
      });
      const created = result[0];
      idMap.set(category.id, created.id);
      byHandle.set(category.slug, created);
      byId.set(created.id, created);
      results.push({ action: "created", handle: category.slug, medusa_id: created.id, supabase_id: category.id });
      logger.info(`[sync] category created: ${category.slug}`);
    }
  }

  return { results, idMap };
}

// ---------------------------------------------------------------------------
// Product sync
// ---------------------------------------------------------------------------

async function syncProducts(
  container: ExecArgs["container"],
  products: SyncProduct[],
  categoryIdMap: Map<string, string>,
  logger: { info(msg: string): void; warn(msg: string): void },
): Promise<SyncResultEntry[]> {
  const storeService = container.resolve(Modules.STORE);
  const fulfillmentService = container.resolve(Modules.FULFILLMENT);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const [store] = await storeService.listStores();
  if (!store?.default_sales_channel_id) {
    throw new Error("Medusa store is missing default_sales_channel_id. Run the Nova seed first.");
  }

  const profiles = await fulfillmentService.listShippingProfiles({ type: "default" });
  const shippingProfile = profiles[0];
  if (!shippingProfile?.id) {
    throw new Error("Default shipping profile not found. Run the Nova seed first.");
  }

  type MedusaProduct = {
    id: string;
    handle?: string | null;
    metadata?: Record<string, unknown> | null;
    variants?: Array<{ id: string; title: string; sku: string | null }>;
  };

  const { data: existingRaw = [] } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata", "variants.id", "variants.title", "variants.sku"],
  });
  const existing = existingRaw as MedusaProduct[];
  const byHandle = new Map(existing.map((p) => [p.handle ?? "", p]));
  const byId = new Map(existing.map((p) => [p.id, p]));
  const results: SyncResultEntry[] = [];

  const sorted = products.slice().sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name, "es"),
  );

  for (const product of sorted) {
    if (!product.category_id) {
      logger.warn(`[sync] product skipped (no category_id): ${product.slug}`);
      continue;
    }

    const medusaCategoryId = categoryIdMap.get(product.category_id);
    if (!medusaCategoryId) {
      logger.warn(`[sync] product skipped (category not synced): ${product.slug}`);
      continue;
    }

    const match =
      (product.medusa_product_id ? byId.get(product.medusa_product_id) : null) ??
      byHandle.get(product.slug) ??
      null;

    const existingPaypalPrice = match?.metadata?.paypal_price_usd as number | undefined;
    const firstImage = product.images[0] ?? null;

    const variantPayload = {
      allow_backorder: false,
      manage_inventory: false,
      options: { Presentacion: "Unica" },
      prices: [{ amount: toMinorUnits(product.price), currency_code: "pen" }],
      sku: buildSku(product.slug),
      title: "Default",
    };

    const basePayload = {
      category_ids: [medusaCategoryId],
      description: product.description,
      discountable: true,
      handle: product.slug,
      images: product.images.map((url) => ({ url })),
      metadata: buildProductMetadata(product, existingPaypalPrice),
      sales_channels: [{ id: store.default_sales_channel_id }],
      shipping_profile_id: shippingProfile.id,
      status: toProductStatus(product.active),
      subtitle: product.short_description,
      thumbnail: firstImage,
      title: product.name,
    };

    const productOptions = [{ title: "Presentacion", values: ["Unica"] }];

    if (match) {
      const existingVariantId = Array.isArray(match.variants) ? match.variants[0]?.id : undefined;
      const { result } = await updateProductsWorkflow(container).run({
        input: {
          products: [
            {
              ...basePayload,
              id: match.id,
              options: productOptions,
              variants: [{ ...variantPayload, id: existingVariantId }],
            },
          ],
        },
      });
      const updated = result[0];
      byHandle.set(product.slug, updated);
      byId.set(updated.id, updated);
      results.push({ action: "updated", handle: product.slug, medusa_id: updated.id, supabase_id: product.id });
      logger.info(`[sync] product updated: ${product.slug}`);
    } else {
      const { result } = await createProductsWorkflow(container).run({
        input: {
          products: [{ ...basePayload, options: productOptions, variants: [variantPayload] }],
        },
      });
      const created = result[0];
      byHandle.set(product.slug, created);
      byId.set(created.id, created);
      results.push({ action: "created", handle: product.slug, medusa_id: created.id, supabase_id: product.id });
      logger.info(`[sync] product created: ${product.slug}`);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Entry point (medusa exec)
// ---------------------------------------------------------------------------

export default async function syncSupabaseStoreToMedusa({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const inputPath = process.env.MEDUSA_SUPABASE_SYNC_INPUT;
  const outputPath = process.env.MEDUSA_SUPABASE_SYNC_OUTPUT;

  if (!inputPath || !outputPath) {
    throw new Error("Missing env: MEDUSA_SUPABASE_SYNC_INPUT or MEDUSA_SUPABASE_SYNC_OUTPUT");
  }

  const input = readInput(inputPath);
  logger.info(`[sync] Starting Supabase → Medusa sync (${input.categories.length} categories, ${input.products.length} products)`);

  const categorySync = await syncCategories(container, input.categories, logger);
  const productResults = await syncProducts(container, input.products, categorySync.idMap, logger);

  writeOutput(outputPath, {
    categories: categorySync.results,
    products: productResults,
  });

  logger.info("[sync] Done.");
}
