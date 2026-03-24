import {
  productCategories,
  type Product,
  type ProductCategory,
  type ProductSpecification,
  type ProductStockStatus,
} from "@/data/types";
import {
  mapListField,
  normalizeStoreCategoryPayload,
  normalizeStoreProductPayload,
  resolveProductCategoryLabels,
  resolveRootProductCategory,
  type StoreCategory,
  type StoreDashboardProduct,
} from "@/lib/data/store";
import { getDefaultCommerceCurrencyCode } from "@/lib/commerce/currency";
import { normalizeCommerceImageUrls } from "@/lib/commerce/image-urls";
import { hasSupabaseServiceRole } from "@/lib/env";
import type { StoreAdminRuntimeRepository } from "@/lib/data/store-admin/repository";
import { getMedusaAdminSdk } from "@/lib/medusa/admin-sdk";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  MedusaAdminCategory,
  MedusaAdminMoneyAmount,
  MedusaAdminProduct,
  MedusaAdminShippingProfile,
  MedusaAdminProductVariant,
} from "@/lib/medusa/admin-types";
import type { StoreCategoryValues, StoreProductValues } from "@/lib/validators/store";

const DEFAULT_PRODUCT_OPTION_TITLE = "Formato";
const DEFAULT_PRODUCT_OPTION_VALUE = "Default";
const MAX_PAGE_SIZE = 100;

const ADMIN_CATEGORY_FIELDS = [
  "id",
  "name",
  "description",
  "handle",
  "is_active",
  "rank",
  "parent_category_id",
  "*parent_category",
  "+metadata",
].join(",");

const ADMIN_PRODUCT_FIELDS = [
  "id",
  "title",
  "subtitle",
  "description",
  "handle",
  "status",
  "*categories",
  "*images",
  "*tags",
  "*variants",
  "*variants.prices",
  "+metadata",
].join(",");

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function asProductSpecifications(value: unknown): ProductSpecification[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const specifications = value
    .map((entry) => {
      const record = asRecord(entry);
      const label = asString(record?.label);
      const specValue = asString(record?.value);

      if (!label || !specValue) {
        return null;
      }

      return {
        label,
        value: specValue,
      } satisfies ProductSpecification;
    })
    .filter((entry): entry is ProductSpecification => Boolean(entry));

  return specifications.length > 0 ? specifications : undefined;
}

function normalizeProductCategory(value: unknown): ProductCategory | null {
  return typeof value === "string" && productCategories.includes(value as ProductCategory)
    ? (value as ProductCategory)
    : null;
}

function normalizeProductStatus(value: unknown) {
  const status = asString(value)?.toLowerCase();
  return status === "published" ? "published" : "draft";
}

function normalizeStockStatus(value: unknown): ProductStockStatus | null {
  return value === "in_stock" ||
    value === "low_stock" ||
    value === "out_of_stock" ||
    value === "coming_soon"
    ? value
    : null;
}

function slugifyFallback(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickLeafCategoryId(categoryIds: string[], categories: StoreCategory[]) {
  if (categoryIds.length === 0) {
    return null;
  }

  const byId = new Map(categories.map((category) => [category.id, category]));
  let selectedId: string | null = null;
  let selectedDepth = -1;

  for (const categoryId of categoryIds) {
    let depth = 0;
    let current = byId.get(categoryId);

    while (current?.parent_id) {
      depth += 1;
      current = byId.get(current.parent_id);
    }

    if (depth > selectedDepth) {
      selectedId = categoryId;
      selectedDepth = depth;
    }
  }

  return selectedId;
}

function mapCategoryRecord(category: MedusaAdminCategory): StoreCategory | null {
  const name = asString(category.name);

  if (!name) {
    return null;
  }

  return {
    id: category.id,
    slug: asString(category.handle) ?? slugifyFallback(name),
    name,
    description: asString(category.description) ?? undefined,
    parent_id: category.parent_category_id ?? category.parent_category?.id ?? null,
    order: asNumber(category.metadata?.order) ?? asNumber(category.rank) ?? 0,
    active: asBoolean(category.is_active) ?? true,
    medusa_category_id: category.id,
  };
}

function resolveVariantPrice(variant: MedusaAdminProductVariant) {
  const prices = Array.isArray(variant.prices) ? variant.prices : [];
  const firstPrice = prices.find(
    (price): price is MedusaAdminMoneyAmount =>
      asNumber(price?.amount) !== null && Boolean(asString(price?.currency_code)),
  );

  if (!firstPrice) {
    return null;
  }

  return {
    amount: (firstPrice.amount ?? 0) / 100,
    currency: asString(firstPrice.currency_code)?.toUpperCase() ?? getDefaultCommerceCurrencyCode(),
  };
}

function resolvePrice(product: MedusaAdminProduct) {
  for (const variant of product.variants ?? []) {
    const price = resolveVariantPrice(variant);

    if (price) {
      return price;
    }
  }

  return {
    amount: 0,
    currency: getDefaultCommerceCurrencyCode(),
  };
}

function resolveStockStatus(product: MedusaAdminProduct): ProductStockStatus {
  const metadataStatus = normalizeStockStatus(product.metadata?.stock_status);

  if (metadataStatus) {
    return metadataStatus;
  }

  const quantities = (product.variants ?? [])
    .map((variant) => variant.inventory_quantity)
    .filter((quantity): quantity is number => typeof quantity === "number");

  if (quantities.length === 0) {
    return "in_stock";
  }

  const highestQuantity = Math.max(...quantities);

  if (highestQuantity <= 0) {
    return "out_of_stock";
  }

  if (highestQuantity <= 5) {
    return "low_stock";
  }

  return "in_stock";
}

function resolveProductImages(product: MedusaAdminProduct) {
  const metadataImages = normalizeCommerceImageUrls(
    mapListField(product.metadata?.storefront_images ?? undefined),
  );

  if (metadataImages.length > 0) {
    return metadataImages;
  }

  return normalizeCommerceImageUrls(
    (product.images ?? []).map((image) => asString(image.url)),
  );
}

function resolveProductTags(product: MedusaAdminProduct) {
  const metadataTags = mapListField(product.metadata?.tags ?? undefined);

  if (metadataTags.length > 0) {
    return metadataTags;
  }

  return (product.tags ?? [])
    .map((tag) => asString(tag.value))
    .filter((tag): tag is string => Boolean(tag));
}

function mapDashboardProductRecord(
  product: MedusaAdminProduct,
  categories: StoreCategory[],
): StoreDashboardProduct | null {
  const name = asString(product.title);
  const slug = asString(product.handle);

  if (!name || !slug) {
    return null;
  }

  const price = resolvePrice(product);
  const categoryIds = (product.categories ?? []).map((category) => category.id).filter(Boolean);
  const fallbackCategory = normalizeProductCategory(product.metadata?.category) ?? "merchandising";
  const leafCategoryId =
    pickLeafCategoryId(categoryIds, categories) ??
    categories.find((category) => category.slug === fallbackCategory)?.id ??
    null;
  const category = resolveRootProductCategory(leafCategoryId, categories, fallbackCategory);
  const labels = resolveProductCategoryLabels(leafCategoryId, categories);

  const mappedProduct: Product = {
    id: product.id,
    slug,
    name,
    eyebrow: asString(product.metadata?.eyebrow) ?? undefined,
    category,
    short_description:
      asString(product.metadata?.short_description) ??
      asString(product.subtitle) ??
      asString(product.description) ??
      name,
    description: asString(product.description) ?? asString(product.subtitle) ?? name,
    price: price.amount,
    paypal_price_usd: asNumber(product.metadata?.paypal_price_usd),
    compare_price: asNumber(product.metadata?.compare_price),
    discount_label: asString(product.metadata?.discount_label) ?? undefined,
    currency: price.currency,
    stock_status: resolveStockStatus(product),
    pickup_only: asBoolean(product.metadata?.pickup_only) ?? true,
    pickup_note: asString(product.metadata?.pickup_note) ?? undefined,
    pickup_summary: asString(product.metadata?.pickup_summary) ?? undefined,
    pickup_eta: asString(product.metadata?.pickup_eta) ?? undefined,
    featured: asBoolean(product.metadata?.featured) ?? false,
    images: resolveProductImages(product),
    tags: resolveProductTags(product),
    highlights: mapListField(product.metadata?.highlights ?? undefined),
    benefits: mapListField(product.metadata?.benefits ?? undefined),
    usage_steps: mapListField(product.metadata?.usage_steps ?? undefined),
    specifications: asProductSpecifications(product.metadata?.specifications),
    options: undefined,
    variants: undefined,
    cta_label: asString(product.metadata?.cta_label) ?? "Disponible en tienda",
    order: asNumber(product.metadata?.order) ?? 0,
    active: normalizeProductStatus(product.status) === "published",
  };

  return {
    ...mappedProduct,
    category_id: leafCategoryId,
    category_name: labels.leaf?.name,
    category_slug: labels.leaf?.slug,
    parent_category_id: labels.root?.id,
    parent_category_name: labels.root?.name,
    parent_category_slug: labels.root?.slug,
    medusa_product_id: product.id,
  };
}

function buildCategoryPayload(values: ReturnType<typeof normalizeStoreCategoryPayload>) {
  return {
    name: values.name,
    handle: values.slug,
    description: values.description ?? null,
    parent_category_id: values.parent_id ?? null,
    is_active: values.active,
    metadata: {
      order: values.order,
    },
  };
}

function buildSharedProductPayload(
  values: ReturnType<typeof normalizeStoreProductPayload>,
  categories: StoreCategory[],
) {
  const normalizedImages = normalizeCommerceImageUrls(values.images);

  return {
    title: values.name,
    subtitle: values.short_description,
    description: values.description,
    handle: values.slug,
    status: values.active ? "published" : "draft",
    images: normalizedImages.map((url) => ({ url })),
    metadata: {
      category: resolveRootProductCategory(values.category_id, categories, "merchandising"),
      short_description: values.short_description,
      discount_label: values.discount_label ?? null,
      stock_status: values.stock_status,
      featured: values.featured,
      pickup_only: values.pickup_only,
      pickup_note: values.pickup_note ?? null,
      pickup_summary: values.pickup_summary ?? null,
      pickup_eta: values.pickup_eta ?? null,
      tags: values.tags,
      highlights: values.highlights,
      benefits: values.benefits,
      usage_steps: values.usage_steps,
      specifications: values.specifications,
      cta_label: values.cta_label,
      order: values.order,
      paypal_price_usd: values.paypal_price_usd,
      compare_price: values.compare_price ?? null,
      storefront_images: normalizedImages,
      eyebrow: values.eyebrow ?? null,
    },
  };
}

async function syncProductCategoryAssignments(
  sdk: ReturnType<typeof getMedusaAdminSdk>,
  productId: string,
  targetCategoryId: string,
  currentCategoryIds: Array<string | null | undefined>,
) {
  const assignedCategoryIds = Array.from(
    new Set(
      currentCategoryIds.filter((categoryId): categoryId is string => Boolean(categoryId)),
    ),
  );

  for (const categoryId of assignedCategoryIds) {
    if (categoryId === targetCategoryId) {
      continue;
    }

    await sdk.admin.productCategory.updateProducts(categoryId, {
      remove: [productId],
    } as never);
  }

  if (!assignedCategoryIds.includes(targetCategoryId)) {
    await sdk.admin.productCategory.updateProducts(targetCategoryId, {
      add: [productId],
    } as never);
  }
}

function buildCreateProductPayload(
  values: ReturnType<typeof normalizeStoreProductPayload>,
  shippingProfileId: string,
  salesChannelId: string,
  categories: StoreCategory[],
) {
  return {
    ...buildSharedProductPayload(values, categories),
    shipping_profile_id: shippingProfileId,
    sales_channels: [{ id: salesChannelId }],
    options: [
      {
        title: DEFAULT_PRODUCT_OPTION_TITLE,
        values: [DEFAULT_PRODUCT_OPTION_VALUE],
      },
    ],
    variants: [
      {
        title: DEFAULT_PRODUCT_OPTION_VALUE,
        options: {
          [DEFAULT_PRODUCT_OPTION_TITLE]: DEFAULT_PRODUCT_OPTION_VALUE,
        },
        manage_inventory: false,
        prices: [
          {
            amount: Math.round(values.price * 100),
            currency_code: values.currency.toLowerCase(),
          },
        ],
      },
    ],
  };
}

function buildUpdateProductPayload(
  values: ReturnType<typeof normalizeStoreProductPayload>,
  salesChannelId: string,
  categories: StoreCategory[],
) {
  return {
    ...buildSharedProductPayload(values, categories),
    sales_channels: [{ id: salesChannelId }],
  };
}

function extractErrorDetails(error: unknown) {
  const record = asRecord(error);
  const responseBody = asRecord(record?.body);

  return {
    message:
      asString(record?.message) ??
      asString(responseBody?.message) ??
      asString(responseBody?.error) ??
      asString(record?.name),
    status: asNumber(record?.status) ?? asNumber(responseBody?.status),
  };
}

function translateMedusaError(error: unknown, fallback: string): Error {
  const details = extractErrorDetails(error);
  const message = details.message?.toLowerCase() ?? "";

  if (details.status === 401 || details.status === 403) {
    return new Error("Medusa rechazo la operacion. Revisa MEDUSA_ADMIN_API_KEY.");
  }

  if (details.status === 404) {
    return new Error("No se encontro el registro solicitado en Medusa.");
  }

  if (
    details.status === 409 ||
    message.includes("already exists") ||
    message.includes("duplicate") ||
    message.includes("handle")
  ) {
    return new Error("Ya existe un elemento con ese slug o identificador en Medusa.");
  }

  if (message.includes("category")) {
    return new Error("La categoria seleccionada no es valida en Medusa.");
  }

  if (message.includes("shipping")) {
    return new Error("Medusa no tiene un shipping profile listo para crear productos.");
  }

  if (details.message) {
    return new Error(`${fallback} ${details.message}`);
  }

  return new Error(fallback);
}

async function listAllCategories() {
  const sdk = getMedusaAdminSdk();
  const categories: MedusaAdminCategory[] = [];
  let offset = 0;

  while (true) {
    const response = (await sdk.admin.productCategory.list({
      fields: ADMIN_CATEGORY_FIELDS,
      limit: MAX_PAGE_SIZE,
      offset,
    } as never)) as {
      product_categories?: MedusaAdminCategory[];
      count?: number;
    };

    const page = response.product_categories ?? [];
    categories.push(...page);

    if (page.length < MAX_PAGE_SIZE || categories.length >= (response.count ?? Number.MAX_SAFE_INTEGER)) {
      break;
    }

    offset += MAX_PAGE_SIZE;
  }

  return categories;
}

async function listAllProducts() {
  const sdk = getMedusaAdminSdk();
  const products: MedusaAdminProduct[] = [];
  let offset = 0;

  while (true) {
    const response = (await sdk.admin.product.list({
      fields: ADMIN_PRODUCT_FIELDS,
      limit: MAX_PAGE_SIZE,
      offset,
    } as never)) as {
      products?: MedusaAdminProduct[];
      count?: number;
    };

    const page = response.products ?? [];
    products.push(...page);

    if (page.length < MAX_PAGE_SIZE || products.length >= (response.count ?? Number.MAX_SAFE_INTEGER)) {
      break;
    }

    offset += MAX_PAGE_SIZE;
  }

  return products;
}

async function getDefaultShippingProfileId() {
  const sdk = getMedusaAdminSdk();
  const response = (await sdk.admin.shippingProfile.list({
    limit: MAX_PAGE_SIZE,
  } as never)) as {
    shipping_profiles?: MedusaAdminShippingProfile[];
  };

  const profile =
    response.shipping_profiles?.find((entry) => entry.type === "default") ??
    response.shipping_profiles?.[0] ??
    null;

  if (!profile) {
    throw new Error("Medusa no tiene ningun shipping profile disponible.");
  }

  return profile.id;
}

async function getDefaultSalesChannelId() {
  const sdk = getMedusaAdminSdk();
  const response = (await sdk.admin.store.list({
    limit: 1,
    fields: "id,default_sales_channel_id",
  } as never)) as {
    stores?: Array<{
      id: string;
      default_sales_channel_id?: string | null;
    }>;
  };

  const salesChannelId = response.stores?.[0]?.default_sales_channel_id ?? null;

  if (!salesChannelId) {
    throw new Error("Medusa no tiene un default sales channel configurado en la store.");
  }

  return salesChannelId;
}

function getSupabaseBridgeClient() {
  if (!hasSupabaseServiceRole()) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY para persistir los enlaces Medusa-Supabase del dashboard.",
    );
  }

  return createSupabaseAdminClient();
}

async function resolveSupabaseCategoryBridgeRowId(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  slug: string,
  currentMedusaCategoryId?: string,
) {
  if (currentMedusaCategoryId) {
    const { data, error } = await supabase
      .from("store_categories")
      .select("id")
      .eq("medusa_category_id", currentMedusaCategoryId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `No se pudo localizar el enlace existente en Supabase para la categoria ${slug}: ${error.message}`,
      );
    }

    if (data?.id) {
      return data.id;
    }
  }

  const { data, error } = await supabase
    .from("store_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo localizar la categoria ${slug} en Supabase para persistir el enlace con Medusa: ${error.message}`,
    );
  }

  return data?.id ?? null;
}

async function resolveSupabaseProductBridgeRowId(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  slug: string,
  currentMedusaProductId?: string,
) {
  if (currentMedusaProductId) {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("medusa_product_id", currentMedusaProductId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `No se pudo localizar el enlace existente en Supabase para el producto ${slug}: ${error.message}`,
      );
    }

    if (data?.id) {
      return data.id;
    }
  }

  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo localizar el producto ${slug} en Supabase para persistir el enlace con Medusa: ${error.message}`,
    );
  }

  return data?.id ?? null;
}

async function persistSupabaseCategoryLinkWithClient(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  slug: string,
  medusaCategoryId: string,
  currentMedusaCategoryId?: string,
) {
  const rowId = await resolveSupabaseCategoryBridgeRowId(
    supabase,
    slug,
    currentMedusaCategoryId,
  );

  if (!rowId) {
    throw new Error(
      `No existe fila puente en Supabase para la categoria ${slug}. La operacion no es valida hasta persistir ese enlace.`,
    );
  }

  const { data, error } = await supabase
    .from("store_categories")
    .update({ medusa_category_id: medusaCategoryId })
    .eq("id", rowId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `No se pudo persistir medusa_category_id en Supabase para la categoria ${slug}${error ? `: ${error.message}` : "."}`,
    );
  }
}

async function persistSupabaseCategoryLink(
  slug: string,
  medusaCategoryId: string,
  currentMedusaCategoryId?: string,
) {
  const supabase = getSupabaseBridgeClient();
  await persistSupabaseCategoryLinkWithClient(
    supabase,
    slug,
    medusaCategoryId,
    currentMedusaCategoryId,
  );
}

async function persistSupabaseProductLinkWithClient(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  slug: string,
  medusaProductId: string,
  currentMedusaProductId?: string,
) {
  const rowId = await resolveSupabaseProductBridgeRowId(
    supabase,
    slug,
    currentMedusaProductId,
  );

  if (!rowId) {
    throw new Error(
      `No existe fila puente en Supabase para el producto ${slug}. La operacion no es valida hasta persistir ese enlace.`,
    );
  }

  const { data, error } = await supabase
    .from("products")
    .update({ medusa_product_id: medusaProductId })
    .eq("id", rowId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `No se pudo persistir medusa_product_id en Supabase para el producto ${slug}${error ? `: ${error.message}` : "."}`,
    );
  }
}

async function persistSupabaseProductLink(
  slug: string,
  medusaProductId: string,
  currentMedusaProductId?: string,
) {
  const supabase = getSupabaseBridgeClient();
  await persistSupabaseProductLinkWithClient(
    supabase,
    slug,
    medusaProductId,
    currentMedusaProductId,
  );
}

async function clearSupabaseCategoryLinkWithClient(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  medusaCategoryId: string,
) {
  const { data, error } = await supabase
    .from("store_categories")
    .update({ medusa_category_id: null })
    .eq("medusa_category_id", medusaCategoryId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `No se pudo limpiar medusa_category_id en Supabase para ${medusaCategoryId}${error ? `: ${error.message}` : "."}`,
    );
  }
}

async function clearSupabaseCategoryLink(medusaCategoryId: string) {
  const supabase = getSupabaseBridgeClient();
  await clearSupabaseCategoryLinkWithClient(supabase, medusaCategoryId);
}

async function clearSupabaseProductLinkWithClient(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  medusaProductId: string,
) {
  const { data, error } = await supabase
    .from("products")
    .update({ medusa_product_id: null })
    .eq("medusa_product_id", medusaProductId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `No se pudo limpiar medusa_product_id en Supabase para ${medusaProductId}${error ? `: ${error.message}` : "."}`,
    );
  }
}

async function clearSupabaseProductLink(medusaProductId: string) {
  const supabase = getSupabaseBridgeClient();
  await clearSupabaseProductLinkWithClient(supabase, medusaProductId);
}

async function resolveCategoryOrThrow(categories: StoreCategory[], categoryId: string) {
  const category = categories.find((entry) => entry.id === categoryId) ?? null;

  if (!category) {
    throw new Error("La categoria seleccionada no existe en Medusa.");
  }

  return category;
}

export function createMedusaStoreAdminRepository(): StoreAdminRuntimeRepository {
  return {
    provider: "medusa",
    source: "medusa",

    async getSnapshot() {
      const categories = await this.listCategories();
      const products = await this.listProducts(categories);

      return {
        categories,
        products,
        warning: null,
      };
    },

    getCategory(id) {
      return this.getCategoryById(id);
    },

    async getProduct(id) {
      const categories = await this.listCategories();
      return this.getProductById(id, categories);
    },

    async listCategories() {
      try {
        return (await listAllCategories())
          .map(mapCategoryRecord)
          .filter((category): category is StoreCategory => Boolean(category))
          .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name, "es"));
      } catch (error) {
        throw translateMedusaError(error, "No se pudieron cargar las categorias desde Medusa.");
      }
    },

    async listProducts(categories) {
      try {
        return (await listAllProducts())
          .map((product) => mapDashboardProductRecord(product, categories))
          .filter((product): product is StoreDashboardProduct => Boolean(product))
          .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name, "es"));
      } catch (error) {
        throw translateMedusaError(error, "No se pudieron cargar los productos desde Medusa.");
      }
    },

    async getCategoryById(id) {
      const sdk = getMedusaAdminSdk();

      try {
        const response = (await sdk.admin.productCategory.retrieve(id, {
          fields: ADMIN_CATEGORY_FIELDS,
        } as never)) as { product_category?: MedusaAdminCategory };
        return response.product_category ? mapCategoryRecord(response.product_category) : null;
      } catch (error) {
        throw translateMedusaError(error, "No se pudo cargar la categoria desde Medusa.");
      }
    },

    async getProductById(id, categories) {
      const sdk = getMedusaAdminSdk();

      try {
        const response = (await sdk.admin.product.retrieve(id, {
          fields: ADMIN_PRODUCT_FIELDS,
        } as never)) as { product?: MedusaAdminProduct };
        return response.product ? mapDashboardProductRecord(response.product, categories) : null;
      } catch (error) {
        throw translateMedusaError(error, "No se pudo cargar el producto desde Medusa.");
      }
    },

    async saveCategory(values: StoreCategoryValues, categoryId?: string) {
      const sdk = getMedusaAdminSdk();
      const payload = normalizeStoreCategoryPayload(values);

      try {
        if (categoryId) {
          const response = (await sdk.admin.productCategory.update(
            categoryId,
            buildCategoryPayload(payload) as never,
            { fields: ADMIN_CATEGORY_FIELDS } as never,
          )) as { product_category?: MedusaAdminCategory };

          const resolvedId = response.product_category?.id ?? categoryId;
          await persistSupabaseCategoryLink(payload.slug, resolvedId, categoryId);
          return resolvedId;
        }

        const response = (await sdk.admin.productCategory.create(
          buildCategoryPayload(payload) as never,
          { fields: ADMIN_CATEGORY_FIELDS } as never,
        )) as { product_category?: MedusaAdminCategory };

        if (!response.product_category?.id) {
          throw new Error("Medusa no devolvio el id de la categoria creada.");
        }

        await persistSupabaseCategoryLink(payload.slug, response.product_category.id);
        return response.product_category.id;
      } catch (error) {
        throw translateMedusaError(error, "No se pudo guardar la categoria en Medusa.");
      }
    },

    async saveProduct(values: StoreProductValues, productId?: string) {
      const sdk = getMedusaAdminSdk();
      const payload = normalizeStoreProductPayload(values);

      try {
        const categories = await this.listCategories();
        await resolveCategoryOrThrow(categories, payload.category_id);
        const shippingProfileId = await getDefaultShippingProfileId();
        const salesChannelId = await getDefaultSalesChannelId();

        if (productId) {
          const response = (await sdk.admin.product.update(
            productId,
            buildUpdateProductPayload(payload, salesChannelId, categories) as never,
            { fields: ADMIN_PRODUCT_FIELDS } as never,
          )) as { product?: MedusaAdminProduct };

          const variantId = response.product?.variants?.[0]?.id ?? null;

          if (variantId) {
            await sdk.admin.product.updateVariant(
              productId,
              variantId,
              {
                title: DEFAULT_PRODUCT_OPTION_VALUE,
                prices: [
                  {
                    amount: Math.round(payload.price * 100),
                    currency_code: payload.currency.toLowerCase(),
                  },
                ],
              } as never,
            );
          }

          const resolvedId = response.product?.id ?? productId;
          await syncProductCategoryAssignments(
            sdk,
            resolvedId,
            payload.category_id,
            response.product?.categories?.map((category) => category.id) ?? [],
          );
        await persistSupabaseProductLink(payload.slug, resolvedId, productId);
          return resolvedId;
        }

        const response = (await sdk.admin.product.create(
          buildCreateProductPayload(payload, shippingProfileId, salesChannelId, categories) as never,
          { fields: ADMIN_PRODUCT_FIELDS } as never,
        )) as { product?: MedusaAdminProduct };

        if (!response.product?.id) {
          throw new Error("Medusa no devolvio el id del producto creado.");
        }

        await syncProductCategoryAssignments(sdk, response.product.id, payload.category_id, []);
        await persistSupabaseProductLink(payload.slug, response.product.id);
        return response.product.id;
      } catch (error) {
        throw translateMedusaError(error, "No se pudo guardar el producto en Medusa.");
      }
    },

    async deactivateCategory(id: string) {
      try {
        const category = await this.getCategoryById(id);

        if (!category) {
          throw new Error("No se encontro la categoria solicitada en Medusa.");
        }

        await this.saveCategory(
          {
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            parent_id: category.parent_id ?? "",
            order: category.order,
            active: false,
          },
          id,
        );
      } catch (error) {
        throw translateMedusaError(error, "No se pudo desactivar la categoria en Medusa.");
      }
    },

    async deactivateProduct(id: string) {
      try {
        const categories = await this.listCategories();
        const product = await this.getProductById(id, categories);

        if (!product) {
          throw new Error("No se encontro el producto solicitado en Medusa.");
        }

        await this.saveProduct(
          {
            name: product.name,
            slug: product.slug,
            category_id: product.category_id ?? "",
            eyebrow: product.eyebrow ?? "",
            short_description: product.short_description,
            description: product.description,
            price: product.price,
            paypal_price_usd: (product.paypal_price_usd ?? "") as StoreProductValues["paypal_price_usd"],
            compare_price: product.compare_price ?? "",
            discount_label: product.discount_label ?? "",
            currency: product.currency,
            stock_status: product.stock_status,
            featured: product.featured,
            pickup_only: product.pickup_only,
            pickup_note: product.pickup_note ?? "",
            pickup_summary: product.pickup_summary ?? "",
            pickup_eta: product.pickup_eta ?? "",
            tags_text: product.tags.join("\n"),
            highlights_text: product.highlights.join("\n"),
            benefits_text: (product.benefits ?? []).join("\n"),
            usage_steps_text: (product.usage_steps ?? []).join("\n"),
            images_text: product.images.join("\n"),
            specifications_text:
              product.specifications?.map((item) => `${item.label}: ${item.value}`).join("\n") ?? "",
            cta_label: product.cta_label,
            order: product.order,
            active: false,
          },
          id,
        );
      } catch (error) {
        throw translateMedusaError(error, "No se pudo desactivar el producto en Medusa.");
      }
    },

    async deleteCategory(id: string) {
      const sdk = getMedusaAdminSdk();

      try {
        await sdk.admin.productCategory.delete(id);
        await clearSupabaseCategoryLink(id);
      } catch (error) {
        throw translateMedusaError(error, "No se pudo borrar la categoria en Medusa.");
      }
    },

    async deleteProduct(id: string) {
      const sdk = getMedusaAdminSdk();

      try {
        await sdk.admin.product.delete(id);
        await clearSupabaseProductLink(id);
      } catch (error) {
        throw translateMedusaError(error, "No se pudo borrar el producto en Medusa.");
      }
    },
  };
}

export function getMedusaStoreAdminRepository() {
  return createMedusaStoreAdminRepository();
}

export const __medusaStoreAdminTestables = {
  buildCreateProductPayload,
  buildSharedProductPayload,
  buildUpdateProductPayload,
  clearSupabaseCategoryLinkWithClient,
  clearSupabaseProductLinkWithClient,
  mapDashboardProductRecord,
  persistSupabaseCategoryLinkWithClient,
  persistSupabaseProductLinkWithClient,
  resolveSupabaseCategoryBridgeRowId,
  resolveSupabaseProductBridgeRowId,
  syncProductCategoryAssignments,
  translateMedusaError,
};
