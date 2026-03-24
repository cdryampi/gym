import type {
  Product,
  ProductCategory,
  ProductOption,
  ProductSpecification,
  ProductStockStatus,
  ProductVariantPreview,
} from "@/data/types";
import {
  getMedusaStoreProductByHandle,
  listMedusaStoreProducts,
} from "@/lib/medusa/products";
import { normalizeCommerceImageUrls } from "@/lib/commerce/image-urls";
import { getDefaultCommerceCurrencyCode } from "@/lib/commerce/currency";
import type {
  MedusaStoreProduct,
  MedusaStoreProductVariant,
} from "@/lib/medusa/storefront-types";

function slugifyCategory(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry));
}

function asRecordArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      )
    : [];
}

function asSpecifications(value: unknown): ProductSpecification[] | undefined {
  const specifications = asRecordArray(value)
    .map((entry) => {
      const label = asString(entry.label);
      const specValue = asString(entry.value);

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

function resolveProductCategory(product: MedusaStoreProduct): ProductCategory {
  const categoryCandidates = [
    asString(product.metadata?.category),
    ...(product.categories ?? []).flatMap((category) => [
      asString(category.handle),
      asString(category.name),
    ]),
    asString(product.collection?.handle),
    asString(product.collection?.title),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of categoryCandidates) {
    const normalized = slugifyCategory(candidate);

    if (
      normalized === "suplementos" ||
      normalized === "accesorios" ||
      normalized === "merchandising"
    ) {
      return normalized;
    }
  }

  return "merchandising";
}

function resolveVariantPrice(variant: MedusaStoreProductVariant | null | undefined) {
  if (!variant) {
    return null;
  }

  const calculatedAmount = asNumber(variant.calculated_price?.calculated_amount);
  const calculatedCurrency = asString(variant.calculated_price?.currency_code);

  if (calculatedAmount !== null && calculatedCurrency) {
    return {
      amount: calculatedAmount / 100,
      currency: calculatedCurrency.toUpperCase(),
    };
  }

  return null;
}

function resolvePrice(product: MedusaStoreProduct) {
  const metadataPrice = asNumber(product.metadata?.price);
  const metadataCurrency = asString(product.metadata?.currency);

  if (metadataPrice !== null && metadataCurrency) {
    return {
      amount: metadataPrice,
      currency: metadataCurrency.toUpperCase(),
    };
  }

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

function resolveComparePrice(product: MedusaStoreProduct) {
  const metadataComparePrice = asNumber(product.metadata?.compare_price);

  if (metadataComparePrice !== null) {
    return metadataComparePrice;
  }

  for (const variant of product.variants ?? []) {
    const originalAmount = asNumber(variant.calculated_price?.original_amount);

    if (originalAmount !== null) {
      const normalized = originalAmount / 100;
      const price = resolveVariantPrice(variant);

      if (price && normalized > price.amount) {
        return normalized;
      }
    }
  }

  return null;
}

function resolvePayPalPriceUsd(product: MedusaStoreProduct) {
  const paypalPriceUsd = asNumber(product.metadata?.paypal_price_usd);
  return paypalPriceUsd !== null ? paypalPriceUsd : null;
}

function resolveStockStatus(product: MedusaStoreProduct): ProductStockStatus {
  const metadataStockStatus = asString(product.metadata?.stock_status);

  if (
    metadataStockStatus === "in_stock" ||
    metadataStockStatus === "low_stock" ||
    metadataStockStatus === "out_of_stock" ||
    metadataStockStatus === "coming_soon"
  ) {
    return metadataStockStatus;
  }

  const inventoryQuantities = (product.variants ?? [])
    .map((variant) => variant.inventory_quantity)
    .filter((value): value is number => typeof value === "number");

  const highestQuantity = inventoryQuantities.length > 0 ? Math.max(...inventoryQuantities) : null;

  if (highestQuantity === null) {
    return "in_stock";
  }

  if (highestQuantity <= 0) {
    return "out_of_stock";
  }

  if (highestQuantity <= 5) {
    return "low_stock";
  }

  return "in_stock";
}

function resolveImages(product: MedusaStoreProduct) {
  const metadataImages = normalizeCommerceImageUrls(
    asStringArray(product.metadata?.storefront_images),
  );

  if (metadataImages.length > 0) {
    return metadataImages;
  }

  const images = normalizeCommerceImageUrls([
    asString(product.thumbnail),
    ...((product.images ?? []).map((image) => asString(image.url))),
  ]);

  return images.length > 0 ? Array.from(new Set(images)) : ["/images/products/product-1.png"];
}

function resolveTags(product: MedusaStoreProduct) {
  const metadataTags = asStringArray(product.metadata?.tags);

  if (metadataTags.length > 0) {
    return metadataTags;
  }

  return (product.tags ?? [])
    .map((tag) => asString(tag.value))
    .filter((tag): tag is string => Boolean(tag));
}

function mapMetadataOptions(product: MedusaStoreProduct): ProductOption[] | undefined {
  const options = asRecordArray(product.metadata?.display_options)
    .map((entry, index) => {
      const title = asString(entry.title);
      const values = asStringArray(entry.values);

      if (!title || values.length === 0) {
        return null;
      }

      return {
        id: asString(entry.id) ?? `${product.id}-metadata-option-${index + 1}`,
        title,
        values,
      } satisfies ProductOption;
    })
    .filter((entry): entry is ProductOption => Boolean(entry));

  return options.length > 0 ? options : undefined;
}

function mapProductOptions(product: MedusaStoreProduct): ProductOption[] | undefined {
  const options = (product.options ?? [])
    .map((option) => {
      const title = asString(option.title);

      if (!title) {
        return null;
      }

      return {
        id: option.id,
        title,
        values: Array.from(
          new Set(
            (option.values ?? [])
              .map((value) => asString(value.value))
              .filter((value): value is string => Boolean(value)),
          ),
        ),
      } satisfies ProductOption;
    })
    .filter((option): option is ProductOption => Boolean(option));

  const hasPlaceholderOption =
    options.length === 1 &&
    options[0]?.title.toLowerCase() === "talla" &&
    options[0].values.length === 1 &&
    options[0].values[0]?.toLowerCase() === "unica";

  if (options.length > 0 && !hasPlaceholderOption) {
    return options;
  }

  return mapMetadataOptions(product) ?? (options.length > 0 ? options : undefined);
}

function mapVariantOptions(
  variant: MedusaStoreProductVariant,
): ProductVariantPreview["options"] {
  const options: ProductVariantPreview["options"] = [];

  for (const value of variant.options ?? []) {
    const optionValue = asString(value.value);

    if (!optionValue) {
      continue;
    }

    options.push({
      option_id: value.option_id ?? undefined,
      option_title: asString(value.option?.title) ?? undefined,
      value: optionValue,
    });
  }

  return options;
}

function mapProductVariants(product: MedusaStoreProduct): ProductVariantPreview[] | undefined {
  const fallbackTitle = asString(product.title) ?? "Variante";
  const variants = (product.variants ?? [])
    .map((variant) => {
      const title = asString(variant.title) ?? fallbackTitle;
      const price = resolveVariantPrice(variant);
      const options = mapVariantOptions(variant);

      return {
        id: variant.id,
        title,
        sku: asString(variant.sku) ?? undefined,
        inventory_quantity:
          typeof variant.inventory_quantity === "number" ? variant.inventory_quantity : null,
        price: price?.amount ?? null,
        currency: price?.currency ?? null,
        options,
      } satisfies ProductVariantPreview;
    })
    .filter((variant) => variant.options.length > 0 || variant.price !== null);

  return variants.length > 0 ? variants : undefined;
}

export function mapMedusaProduct(product: MedusaStoreProduct): Product | null {
  const name = asString(product.title);
  const slug = asString(product.handle);

  if (!name || !slug) {
    return null;
  }

  const price = resolvePrice(product);
  const comparePrice = resolveComparePrice(product);
  const description = asString(product.description) ?? asString(product.subtitle) ?? name;

  return {
    id: product.id,
    slug,
    name,
    eyebrow: asString(product.metadata?.eyebrow) ?? undefined,
    category: resolveProductCategory(product),
    short_description:
      asString(product.metadata?.short_description) ??
      asString(product.subtitle) ??
      description.slice(0, 160),
    description,
    price: price.amount,
    paypal_price_usd: resolvePayPalPriceUsd(product),
    compare_price: comparePrice,
    discount_label: asString(product.metadata?.discount_label) ?? undefined,
    currency: price.currency,
    stock_status: resolveStockStatus(product),
    pickup_only: asBoolean(product.metadata?.pickup_only) ?? true,
    pickup_note: asString(product.metadata?.pickup_note) ?? undefined,
    pickup_summary: asString(product.metadata?.pickup_summary) ?? undefined,
    pickup_eta: asString(product.metadata?.pickup_eta) ?? undefined,
    featured: asBoolean(product.metadata?.featured) ?? false,
    images: resolveImages(product),
    tags: resolveTags(product),
    highlights: asStringArray(product.metadata?.highlights),
    benefits: asStringArray(product.metadata?.benefits),
    usage_steps: asStringArray(product.metadata?.usage_steps),
    specifications: asSpecifications(product.metadata?.specifications),
    options: mapProductOptions(product),
    variants: mapProductVariants(product),
    cta_label: asString(product.metadata?.cta_label) ?? "Disponible en tienda",
    order: asNumber(product.metadata?.order) ?? 0,
    active: product.status ? product.status.toLowerCase() === "published" : true,
  };
}

export async function getMedusaCommerceProducts(): Promise<Product[]> {
  const products = await listMedusaStoreProducts();

  return products
    .map(mapMedusaProduct)
    .filter((product): product is Product => Boolean(product))
    .filter((product) => product.active)
    .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name, "es"));
}

export async function getMedusaCommerceProductBySlug(slug: string): Promise<Product | null> {
  const product = await getMedusaStoreProductByHandle(slug);

  if (!product) {
    return null;
  }

  const mapped = mapMedusaProduct(product);
  return mapped?.active ? mapped : null;
}
