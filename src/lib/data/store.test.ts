import { describe, expect, it } from "vitest";

import {
  buildStoreCategoryTree,
  normalizeStoreCategoryPayload,
  normalizeStoreProductPayload,
  resolveRootProductCategory,
  type StoreCategory,
} from "@/lib/data/store";

const categories: StoreCategory[] = [
  { id: "root-sup", slug: "suplementos", name: "Suplementos", order: 1, active: true },
  { id: "sub-prot", slug: "proteinas", name: "Proteinas", parent_id: "root-sup", order: 1, active: true },
  { id: "root-acc", slug: "accesorios", name: "Accesorios", order: 2, active: true },
];

describe("store data helpers", () => {
  it("builds a parent-child category tree", () => {
    const tree = buildStoreCategoryTree(categories);

    expect(tree).toHaveLength(2);
    expect(tree[0]?.name).toBe("Suplementos");
    expect(tree[0]?.children[0]?.name).toBe("Proteinas");
  });

  it("resolves the root category for storefront compatibility", () => {
    expect(resolveRootProductCategory("sub-prot", categories, "merchandising")).toBe(
      "suplementos",
    );
  });

  it("normalizes category and product payloads from form values", () => {
    const categoryPayload = normalizeStoreCategoryPayload({
      name: " Proteinas ",
      slug: "",
      description: "  Categoria premium ",
      parent_id: "",
      order: 2,
      active: true,
    });
    const productPayload = normalizeStoreProductPayload({
      name: " Whey Nova ",
      slug: "",
      category_id: "sub-prot",
      eyebrow: " Elite ",
      short_description: "Descripcion corta valida",
      description: "Descripcion completa suficientemente larga para el validador.",
      price: 49.99,
      paypal_price_usd: 13.95,
      compare_price: "",
      discount_label: " Oferta ",
      currency: "pen",
      stock_status: "in_stock",
      featured: true,
      pickup_only: true,
      pickup_note: " Recogida ",
      pickup_summary: " En club ",
      pickup_eta: " 24h ",
      tags_text: "Proteina\nRecuperacion",
      highlights_text: "24 g\nDigestiva",
      benefits_text: "",
      usage_steps_text: "",
      images_text: "/img/a.png\n/img/b.png",
      specifications_text: "Peso: 2 kg",
      cta_label: " Reservar ",
      order: 1,
      active: true,
    });

    expect(categoryPayload.slug).toBe("proteinas");
    expect(productPayload.slug).toBe("whey-nova");
    expect(productPayload.currency).toBe("PEN");
    expect(productPayload.paypal_price_usd).toBe(13.95);
    expect(productPayload.images).toEqual(["/img/a.png", "/img/b.png"]);
    expect(productPayload.specifications?.[0]).toEqual({ label: "Peso", value: "2 kg" });
  });
});
