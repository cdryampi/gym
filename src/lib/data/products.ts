import {
  productCategories,
  productStockStatuses,
  type Product,
  type ProductCategory,
  type ProductStockStatus,
} from "@/data/types";

export const productCategoryLabels: Record<ProductCategory, string> = {
  suplementos: "Suplementos",
  accesorios: "Accesorios",
  merchandising: "Merchandising",
};

export const productStockStatusLabels: Record<ProductStockStatus, string> = {
  in_stock: "Disponible",
  low_stock: "Últimas unidades",
  out_of_stock: "Agotado",
  coming_soon: "Próximamente",
};

export const productSortOptions = [
  "featured",
  "price_asc",
  "price_desc",
  "name",
] as const;

export type ProductSortOption = (typeof productSortOptions)[number];

export interface ProductCatalogueFilters {
  category: ProductCategory | "all";
  featuredOnly: boolean;
  availability: ProductStockStatus | "all";
  query: string;
  sort: ProductSortOption;
}

export interface ProductSearchParamsInput {
  categoria?: string | string[];
  destacados?: string | string[];
  disponibilidad?: string | string[];
  q?: string | string[];
  sort?: string | string[];
}

export const defaultProductCatalogueFilters: ProductCatalogueFilters = {
  category: "all",
  featuredOnly: false,
  availability: "all",
  query: "",
  sort: "featured",
};

export function getActiveProducts(productsList: Product[]) {
  return [...productsList]
    .filter((product) => product.active)
    .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name, "es"));
}

function getFirstParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isProductCategory(value: string): value is ProductCategory {
  return productCategories.includes(value as ProductCategory);
}

function isProductStockStatus(value: string): value is ProductStockStatus {
  return productStockStatuses.includes(value as ProductStockStatus);
}

function isProductSortOption(value: string): value is ProductSortOption {
  return productSortOptions.includes(value as ProductSortOption);
}

export function normalizeProductFilters(
  searchParams: ProductSearchParamsInput,
): ProductCatalogueFilters {
  const rawCategory = getFirstParamValue(searchParams.categoria)?.trim().toLowerCase();
  const rawAvailability = getFirstParamValue(searchParams.disponibilidad)?.trim().toLowerCase();
  const rawQuery = getFirstParamValue(searchParams.q)?.trim() ?? "";
  const rawSort = getFirstParamValue(searchParams.sort)?.trim().toLowerCase();
  const featuredValue = getFirstParamValue(searchParams.destacados)?.trim().toLowerCase();

  return {
    category: rawCategory && isProductCategory(rawCategory) ? rawCategory : "all",
    availability:
      rawAvailability && isProductStockStatus(rawAvailability) ? rawAvailability : "all",
    featuredOnly: featuredValue === "true",
    query: rawQuery,
    sort: rawSort && isProductSortOption(rawSort) ? rawSort : "featured",
  };
}

function sortProducts(items: Product[], sort: ProductSortOption) {
  switch (sort) {
    case "price_asc":
      return [...items].sort((left, right) => left.price - right.price || left.order - right.order);
    case "price_desc":
      return [...items].sort((left, right) => right.price - left.price || left.order - right.order);
    case "name":
      return [...items].sort((left, right) => left.name.localeCompare(right.name, "es"));
    case "featured":
    default:
      return [...items].sort((left, right) => {
        if (left.featured !== right.featured) {
          return Number(right.featured) - Number(left.featured);
        }

        if (left.stock_status !== right.stock_status) {
          const priority = {
            in_stock: 0,
            low_stock: 1,
            coming_soon: 2,
            out_of_stock: 3,
          } satisfies Record<ProductStockStatus, number>;

          return priority[left.stock_status] - priority[right.stock_status];
        }

        return left.order - right.order;
      });
  }
}

export function filterProducts(
  productsList: Product[],
  filters: ProductCatalogueFilters,
) {
  const normalizedQuery = filters.query.toLowerCase();

  const filtered = productsList.filter((product) => {
    if (filters.category !== "all" && product.category !== filters.category) {
      return false;
    }

    if (filters.featuredOnly && !product.featured) {
      return false;
    }

    if (filters.availability !== "all" && product.stock_status !== filters.availability) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchableFields = [
      product.name,
      product.short_description,
      product.description,
      ...product.tags,
      ...product.highlights,
    ]
      .join(" ")
      .toLowerCase();

    return searchableFields.includes(normalizedQuery);
  });

  return sortProducts(filtered, filters.sort);
}

export function getAllProducts(productsList: Product[], filters?: ProductCatalogueFilters) {
  const activeProducts = getActiveProducts(productsList);
  return filters ? filterProducts(activeProducts, filters) : activeProducts;
}

export function getFeaturedProducts(productsList: Product[], limit = 4) {
  return getAllProducts(productsList, defaultProductCatalogueFilters)
    .filter((product) => product.featured)
    .slice(0, limit);
}

export function getProductBySlug(productsList: Product[], slug: string) {
  return getActiveProducts(productsList).find((product) => product.slug === slug) ?? null;
}

export function getRelatedProducts(productsList: Product[], product: Product, limit = 3) {
  const activeProducts = getActiveProducts(productsList);

  const sameCategory = activeProducts.filter(
    (candidate) => candidate.slug !== product.slug && candidate.category === product.category,
  );

  const fallback = activeProducts.filter((candidate) => candidate.slug !== product.slug);
  const pool = sameCategory.length >= limit ? sameCategory : [...sameCategory, ...fallback];

  return pool.slice(0, limit);
}

export function formatProductPrice(product: Pick<Product, "price" | "currency">) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: product.currency,
  }).format(product.price);
}

export function getProductStockMeta(stockStatus: ProductStockStatus) {
  switch (stockStatus) {
    case "in_stock":
      return {
        label: productStockStatusLabels[stockStatus],
        description: "Disponible ahora en el club.",
        badgeVariant: "success" as const,
      };
    case "low_stock":
      return {
        label: productStockStatusLabels[stockStatus],
        description: "Conviene consultarlo antes de venir al gimnasio.",
        badgeVariant: "warning" as const,
      };
    case "coming_soon":
      return {
        label: productStockStatusLabels[stockStatus],
        description: "Producto previsto para la próxima reposición.",
        badgeVariant: "muted" as const,
      };
    case "out_of_stock":
    default:
      return {
        label: productStockStatusLabels.out_of_stock,
        description: "Sin unidades activas en este momento.",
        badgeVariant: "muted" as const,
      };
  }
}

export function buildShopHref(
  filters: ProductCatalogueFilters,
  overrides: Partial<ProductCatalogueFilters> = {},
) {
  const nextFilters = { ...filters, ...overrides };
  const searchParams = new URLSearchParams();

  if (nextFilters.category !== "all") {
    searchParams.set("categoria", nextFilters.category);
  }

  if (nextFilters.featuredOnly) {
    searchParams.set("destacados", "true");
  }

  if (nextFilters.availability !== "all") {
    searchParams.set("disponibilidad", nextFilters.availability);
  }

  if (nextFilters.query) {
    searchParams.set("q", nextFilters.query);
  }

  if (nextFilters.sort !== "featured") {
    searchParams.set("sort", nextFilters.sort);
  }

  const queryString = searchParams.toString();
  return queryString ? `/tienda?${queryString}` : "/tienda";
}

export function countProductsByCategory(productsList: Product[]) {
  return productCategories.reduce<Record<ProductCategory, number>>((accumulator, category) => {
    accumulator[category] = productsList.filter((product) => product.category === category).length;
    return accumulator;
  }, {} as Record<ProductCategory, number>);
}
