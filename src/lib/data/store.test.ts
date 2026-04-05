import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  buildStoreProductPreview,
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

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

describe("store data helpers", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://nbjkfyjeewprnxxibhwz.supabase.co";
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  });

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

  it("builds a storefront preview product from draft form values", () => {
    const preview = buildStoreProductPreview(
      {
        name: " Elite Whey ",
        slug: "",
        category_id: "sub-prot",
        eyebrow: " Recovery ",
        short_description: "Proteina limpia para recuperarte mejor.",
        description: "Descripcion larga para revisar como queda la ficha de producto en tienda.",
        price: 45.5,
        paypal_price_usd: 12.3,
        compare_price: "49.99",
        discount_label: " Promo ",
        currency: "pen",
        stock_status: "low_stock",
        featured: true,
        pickup_only: true,
        pickup_note: "Disponible hoy",
        pickup_summary: "Recogida en club",
        pickup_eta: "Listo en recepcion",
        tags_text: "Proteina\nRecuperacion",
        highlights_text: "24 g por toma\nAlta digestibilidad",
        benefits_text: "Recuperacion mas rapida",
        usage_steps_text: "Mezcla una toma con agua",
        images_text: "",
        specifications_text: "Peso: 2 kg\nSabor: Chocolate",
        cta_label: "Reservar",
        order: 2,
        active: true,
      },
      categories,
    );

    expect(preview.slug).toBe("elite-whey");
    expect(preview.category).toBe("suplementos");
    expect(preview.images).toEqual(["/images/products/product-1.png"]);
    expect(preview.tags).toEqual(["Proteina", "Recuperacion"]);
    expect(preview.highlights).toEqual(["24 g por toma", "Alta digestibilidad"]);
    expect(preview.benefits).toEqual(["Recuperacion mas rapida"]);
    expect(preview.usage_steps).toEqual(["Mezcla una toma con agua"]);
    expect(preview.specifications).toEqual([
      { label: "Peso", value: "2 kg" },
      { label: "Sabor", value: "Chocolate" },
    ]);
    expect(preview.options?.[0]?.title).toBe("Presentacion");
    expect(preview.variants?.[0]?.price).toBe(45.5);
  });

  it("normalizes preview images to the Supabase public bucket", () => {
    const preview = buildStoreProductPreview(
      {
        name: "Straps Pro",
        slug: "straps-pro",
        category_id: "root-acc",
        eyebrow: "",
        short_description: "Accesorio para entrenar mejor.",
        description: "Descripcion larga para poder validar la ficha del producto en la preview.",
        price: 19.9,
        paypal_price_usd: "",
        compare_price: "",
        discount_label: "",
        currency: "pen",
        stock_status: "in_stock",
        featured: false,
        pickup_only: true,
        pickup_note: "",
        pickup_summary: "",
        pickup_eta: "",
        tags_text: "",
        highlights_text: "",
        benefits_text: "",
        usage_steps_text: "",
        images_text: "http://localhost:3000/images/products/straps.png\nnova-guantes.png",
        specifications_text: "",
        cta_label: "Reservar",
        order: 0,
        active: true,
      },
      categories,
    );

    expect(preview.images).toEqual([
      "https://nbjkfyjeewprnxxibhwz.supabase.co/storage/v1/object/public/medusa-media/straps.png",
      "https://nbjkfyjeewprnxxibhwz.supabase.co/storage/v1/object/public/medusa-media/nova-guantes.png",
    ]);
  });
});
