import { describe, expect, it } from "vitest";

import { products as mockProducts } from "@/data/products";
import {
  buildShopHref,
  defaultProductCatalogueFilters,
  filterProducts,
  getActiveProducts,
  getProductBySlug,
  normalizeProductFilters,
} from "@/lib/data/products";

describe("product catalogue helpers", () => {
  it("normalizes known query params and falls back for invalid values", () => {
    expect(
      normalizeProductFilters({
        categoria: "suplementos",
        destacados: "true",
        disponibilidad: "low_stock",
        q: "whey",
        sort: "price_desc",
      }),
    ).toEqual({
      category: "suplementos",
      featuredOnly: true,
      availability: "low_stock",
      query: "whey",
      sort: "price_desc",
    });

    expect(
      normalizeProductFilters({
        categoria: "otra",
        destacados: "no",
        disponibilidad: "x",
        sort: "random",
      }),
    ).toEqual(defaultProductCatalogueFilters);
  });

  it("filters and sorts products from the active catalogue", () => {
    const products = filterProducts(getActiveProducts(mockProducts), {
      ...defaultProductCatalogueFilters,
      category: "accesorios",
      query: "powerlifting",
      sort: "name",
    });

    expect(products).toHaveLength(1);
    expect(products[0]?.slug).toBe("straps-de-levantamiento-pro");
  });

  it("builds shareable shop URLs from the current filter state", () => {
    expect(
      buildShopHref(defaultProductCatalogueFilters, {
        category: "merchandising",
        featuredOnly: true,
        sort: "price_asc",
      }),
    ).toBe("/tienda?categoria=merchandising&destacados=true&sort=price_asc");
  });

  it("finds products by slug", () => {
    expect(getProductBySlug(mockProducts, "creatina-monohidratada-300g")?.name).toBe(
      "Creatina Monohidratada 300 g",
    );
    expect(getProductBySlug(mockProducts, "no-existe")).toBeNull();
  });
});
