import { productCategories, type Product, type ProductCategory } from "@/data/types";
import type { DBProduct, DBStoreCategory } from "@/lib/supabase/database.types";
import { slugify, trimToNull } from "@/lib/utils";
import type {
  StoreCategoryInput,
  StoreCategoryValues,
  StoreProductInput,
  StoreProductValues,
} from "@/lib/validators/store";

export interface StoreCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  order: number;
  active: boolean;
  medusa_category_id?: string | null;
}

export interface StoreCategoryNode extends StoreCategory {
  children: StoreCategoryNode[];
}

export interface StoreDashboardProduct extends Product {
  category_id?: string | null;
  category_name?: string;
  category_slug?: string;
  parent_category_id?: string | null;
  parent_category_name?: string | null;
  parent_category_slug?: string | null;
  medusa_product_id?: string | null;
}

export function mapSpecifications(value: DBProduct["specifications"]): Product["specifications"] {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const specifications = value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const label = typeof entry.label === "string" ? entry.label.trim() : "";
      const specValue = typeof entry.value === "string" ? entry.value.trim() : "";

      return label && specValue ? { label, value: specValue } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return specifications.length > 0 ? specifications : undefined;
}

export function mapListField(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => v.trim()).filter(Boolean);
}

export function mapStoreCategory(row: DBStoreCategory): StoreCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    parent_id: row.parent_id,
    order: row.order,
    active: row.active,
    medusa_category_id: row.medusa_category_id,
  };
}

export function buildStoreCategoryTree(categories: StoreCategory[]) {
  const byParent = new Map<string | null, StoreCategory[]>();

  for (const category of categories) {
    const key = category.parent_id ?? null;
    const bucket = byParent.get(key) ?? [];
    bucket.push(category);
    byParent.set(key, bucket);
  }

  const sortCategories = (items: StoreCategory[]) =>
    [...items].sort((left, right) => left.order - right.order || left.name.localeCompare(right.name, "es"));

  const buildNode = (category: StoreCategory): StoreCategoryNode => ({
    ...category,
    children: sortCategories(byParent.get(category.id) ?? []).map(buildNode),
  });

  return sortCategories(byParent.get(null) ?? []).map(buildNode);
}

export function flattenStoreCategoryOptions(categories: StoreCategory[]) {
  const tree = buildStoreCategoryTree(categories);

  return tree.flatMap((root) => [
    { value: root.id, label: root.name, depth: 0 },
    ...root.children.map((child) => ({
      value: child.id,
      label: `${root.name} / ${child.name}`,
      depth: 1,
    })),
  ]);
}

function findCategoryChain(categoryId: string | null | undefined, categories: StoreCategory[]) {
  if (!categoryId) {
    return [];
  }

  const byId = new Map(categories.map((category) => [category.id, category]));
  const chain: StoreCategory[] = [];
  let current = byId.get(categoryId);

  while (current) {
    chain.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }

  return chain;
}

export function resolveRootProductCategory(
  categoryId: string | null | undefined,
  categories: StoreCategory[],
  fallback: ProductCategory,
): ProductCategory {
  const chain = findCategoryChain(categoryId, categories);
  const root = chain[0];

  if (!root) {
    return fallback;
  }

  const normalized = root.slug.toLowerCase();
  
  // Strict check against allowed storefront categories
  if (productCategories.includes(normalized as ProductCategory)) {
    return normalized as ProductCategory;
  }

  // Fallback to searching by name if slug doesn't match directly
  const byName = slugify(root.name);
  if (productCategories.includes(byName as ProductCategory)) {
    return byName as ProductCategory;
  }

  return fallback;
}

export function resolveProductCategoryLabels(
  categoryId: string | null | undefined,
  categories: StoreCategory[],
) {
  const chain = findCategoryChain(categoryId, categories);
  const root = chain[0] ?? null;
  const leaf = chain.at(-1) ?? null;

  return {
    root,
    leaf,
  };
}

export function parseTextareaLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function formatTextareaLines(values: string[] | undefined) {
  return values?.join("\n") ?? "";
}

export function parseSpecificationLines(value: string) {
  return parseTextareaLines(value)
    .map((line) => {
      const [label, ...rest] = line.split(":");
      const specValue = rest.join(":").trim();
      const cleanLabel = label?.trim();

      if (!cleanLabel || !specValue) {
        return null;
      }

      return {
        label: cleanLabel,
        value: specValue,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

export function formatSpecificationLines(specifications: Product["specifications"]) {
  return specifications?.map((item) => `${item.label}: ${item.value}`).join("\n") ?? "";
}

export function toStoreCategoryFormValues(category?: StoreCategory | null): StoreCategoryInput {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    parent_id: category?.parent_id ?? "",
    order: category?.order ?? 0,
    active: category?.active ?? true,
  };
}

export function toStoreProductFormValues(product?: StoreDashboardProduct | null): StoreProductInput {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    category_id: product?.category_id ?? "",
    eyebrow: product?.eyebrow ?? "",
    short_description: product?.short_description ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    compare_price: product?.compare_price ?? "",
    discount_label: product?.discount_label ?? "",
    currency: product?.currency ?? "PEN",
    stock_status: product?.stock_status ?? "in_stock",
    featured: product?.featured ?? false,
    pickup_only: product?.pickup_only ?? true,
    pickup_note: product?.pickup_note ?? "",
    pickup_summary: product?.pickup_summary ?? "",
    pickup_eta: product?.pickup_eta ?? "",
    tags_text: formatTextareaLines(product?.tags),
    highlights_text: formatTextareaLines(product?.highlights),
    benefits_text: formatTextareaLines(product?.benefits),
    usage_steps_text: formatTextareaLines(product?.usage_steps),
    images_text: formatTextareaLines(product?.images),
    specifications_text: formatSpecificationLines(product?.specifications),
    cta_label: product?.cta_label ?? "Disponible en tienda",
    order: product?.order ?? 0,
    active: product?.active ?? true,
  };
}

export function normalizeStoreCategoryPayload(values: StoreCategoryValues) {
  return {
    name: values.name.trim(),
    slug: slugify(values.slug || values.name),
    description: trimToNull(values.description),
    parent_id: trimToNull(values.parent_id),
    order: values.order,
    active: values.active,
  };
}

export function normalizeStoreProductPayload(values: StoreProductValues) {
  return {
    name: values.name.trim(),
    slug: slugify(values.slug || values.name),
    category_id: values.category_id,
    eyebrow: trimToNull(values.eyebrow),
    short_description: values.short_description.trim(),
    description: values.description.trim(),
    price: values.price,
    compare_price:
      typeof values.compare_price === "number" && Number.isFinite(values.compare_price)
        ? values.compare_price
        : null,
    discount_label: trimToNull(values.discount_label ?? ""),
    currency: values.currency.trim().toUpperCase(),
    stock_status: values.stock_status,
    featured: values.featured,
    pickup_only: values.pickup_only,
    pickup_note: trimToNull(values.pickup_note ?? ""),
    pickup_summary: trimToNull(values.pickup_summary ?? ""),
    pickup_eta: trimToNull(values.pickup_eta ?? ""),
    tags: parseTextareaLines(values.tags_text ?? ""),
    highlights: parseTextareaLines(values.highlights_text ?? ""),
    benefits: parseTextareaLines(values.benefits_text ?? ""),
    usage_steps: parseTextareaLines(values.usage_steps_text ?? ""),
    images: parseTextareaLines(values.images_text),
    specifications: parseSpecificationLines(values.specifications_text ?? ""),
    cta_label: values.cta_label.trim(),
    order: values.order,
    active: values.active,
  };
}

export function mapDashboardProduct(
  product: DBProduct,
  categories: StoreCategory[],
  mappedProduct: Product,
): StoreDashboardProduct {
  const labels = resolveProductCategoryLabels(product.category_id, categories);

  return {
    ...mappedProduct,
    category_id: product.category_id,
    category_name: labels.leaf?.name,
    category_slug: labels.leaf?.slug,
    parent_category_id: labels.root?.id,
    parent_category_name: labels.root?.name,
    parent_category_slug: labels.root?.slug,
    medusa_product_id: product.medusa_product_id,
  };
}
