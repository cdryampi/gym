import { describe, expect, it, vi } from "vitest";

import type { MedusaStoreProduct } from "@/lib/medusa/storefront-types";

const medusaProductsMocks = vi.hoisted(() => ({
  listMedusaStoreProducts: vi.fn(),
  getMedusaStoreProductByHandle: vi.fn(),
}));

vi.mock("@/lib/medusa/products", () => ({
  listMedusaStoreProducts: medusaProductsMocks.listMedusaStoreProducts,
  getMedusaStoreProductByHandle: medusaProductsMocks.getMedusaStoreProductByHandle,
}));

import {
  getMedusaCommerceProductBySlug,
  getMedusaCommerceProducts,
  mapMedusaProduct,
} from "@/lib/commerce/medusa";

function buildStoreProduct(overrides: Partial<MedusaStoreProduct> = {}) {
  return {
    id: "prod_01",
    title: "Nova Forza Isolate Whey Protein",
    handle: "whey-nova-forza",
    subtitle: "Proteina limpia para el dia a dia",
    description: "Descripcion larga de producto",
    is_giftcard: false,
    status: "published",
    thumbnail: "https://cdn.example.com/whey.png",
    width: null,
    weight: null,
    length: null,
    height: null,
    origin_country: null,
    hs_code: null,
    mid_code: null,
    material: null,
    collection: {
      id: "pcol_01",
      title: "Suplementos",
      handle: "suplementos",
      created_at: null,
      updated_at: null,
      deleted_at: null,
      metadata: null,
    },
    collection_id: "pcol_01",
    categories: [
      {
        id: "pcat_01",
        name: "Suplementos",
        handle: "suplementos",
        description: null,
        rank: 0,
        parent_category_id: null,
        parent_category: null,
        category_children: [],
        created_at: null,
        updated_at: null,
        metadata: null,
      },
    ],
    type: null,
    type_id: null,
    tags: [
      {
        id: "ptag_01",
        value: "Proteina",
        created_at: null,
        updated_at: null,
        metadata: null,
      },
    ],
    variants: [
      {
        id: "variant_01",
        title: "Chocolate",
        sku: "WHEY-CHOCO",
        barcode: null,
        ean: null,
        upc: null,
        thumbnail: null,
        allow_backorder: false,
        manage_inventory: true,
        inventory_quantity: 12,
        hs_code: null,
        origin_country: null,
        mid_code: null,
        material: null,
        weight: null,
        length: null,
        height: null,
        width: null,
        variant_rank: 0,
        options: [
          {
            id: "optval_01",
            value: "Chocolate",
            option_id: "opt_01",
            option: {
              id: "opt_01",
              title: "Sabor",
              product_id: "prod_01",
              product: null,
              values: [],
              metadata: null,
              created_at: null,
              updated_at: null,
              deleted_at: null,
            },
            metadata: null,
            created_at: null,
            updated_at: null,
            deleted_at: null,
          },
        ],
        product: null,
        product_id: "prod_01",
        calculated_price: {
          id: "pset_01",
          calculated_amount: 4999,
          calculated_amount_with_tax: 4999,
          calculated_amount_without_tax: 4999,
          original_amount: 5899,
          original_amount_with_tax: 5899,
          original_amount_without_tax: 5899,
          currency_code: "eur",
        },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        deleted_at: null,
        metadata: null,
      },
    ],
    options: [
      {
        id: "opt_01",
        title: "Sabor",
        product_id: "prod_01",
        product: null,
        values: [
          {
            id: "optval_01",
            value: "Chocolate",
            option_id: "opt_01",
            option: null,
            metadata: null,
            created_at: null,
            updated_at: null,
            deleted_at: null,
          },
        ],
        metadata: null,
        created_at: null,
        updated_at: null,
        deleted_at: null,
      },
    ],
    images: [
      {
        id: "img_01",
        url: "https://cdn.example.com/whey.png",
        rank: 0,
        created_at: null,
        updated_at: null,
        deleted_at: null,
        metadata: null,
      },
    ],
    discountable: true,
    external_id: null,
    created_at: null,
    updated_at: null,
    deleted_at: null,
    metadata: {
      eyebrow: "Suplemento de elite",
      featured: true,
      pickup_only: true,
      pickup_summary: "Recogida en Nova Forza Gym",
      pickup_eta: "Tu producto estara listo en menos de 24 horas laborables.",
      short_description: "Cubre la proteina diaria sin pesadez.",
      highlights: ["24 g de proteina por toma"],
      benefits: ["Sintesis muscular acelerada."],
      usage_steps: ["Mezcla una toma con agua fria."],
      specifications: [{ label: "Peso neto", value: "2 kg / 4.4 lbs" }],
      cta_label: "Reservar para recogida",
      discount_label: "Ahorra 15%",
      paypal_price_usd: 13.95,
      order: 2,
    },
    ...overrides,
  } as MedusaStoreProduct;
}

describe("medusa commerce", () => {
  it("maps a Medusa store product to the storefront product contract", () => {
    const product = mapMedusaProduct(buildStoreProduct());

    expect(product).not.toBeNull();
    expect(product?.slug).toBe("whey-nova-forza");
    expect(product?.category).toBe("suplementos");
    expect(product?.price).toBe(49.99);
    expect(product?.paypal_price_usd).toBe(13.95);
    expect(product?.compare_price).toBe(58.99);
    expect(product?.discount_label).toBe("Ahorra 15%");
    expect(product?.pickup_summary).toBe("Recogida en Nova Forza Gym");
    expect(product?.specifications?.[0]?.label).toBe("Peso neto");
    expect(product?.options?.[0]?.title).toBe("Sabor");
    expect(product?.variants?.[0]?.options[0]?.value).toBe("Chocolate");
  });

  it("prefers metadata display options when Medusa only exposes a placeholder option", () => {
    const product = mapMedusaProduct(
      buildStoreProduct({
        options: [
          {
            id: "opt_99",
            title: "Talla",
            product_id: "prod_01",
            product: null,
            values: [
              {
                id: "optval_99",
                value: "Unica",
                option_id: "opt_99",
                option: null,
                metadata: null,
                created_at: "",
                updated_at: "",
                deleted_at: null,
              },
            ],
            metadata: null,
            created_at: "",
            updated_at: "",
            deleted_at: null,
          },
        ],
        metadata: {
          display_options: [
            {
              title: "Sabor",
              values: ["Chocolate Suizo", "Vanilla Bourbon"],
            },
          ],
        },
      }),
    );

    expect(product?.options?.[0]?.title).toBe("Sabor");
    expect(product?.options?.[0]?.values).toContain("Chocolate Suizo");
  });

  it("normalizes legacy localhost and filename-only image URLs", () => {
    const product = mapMedusaProduct(
      buildStoreProduct({
        metadata: {
          storefront_images: [
            "http://localhost:3000/images/products/nova-whey.png",
            "nova-creatina.png",
          ],
        },
      }),
    );

    expect(product?.images).toEqual([
      "/images/products/nova-whey.png",
      "/images/products/nova-creatina.png",
    ]);
  });

  it("lists published Medusa products ordered by metadata order", async () => {
    medusaProductsMocks.listMedusaStoreProducts.mockResolvedValue([
      buildStoreProduct({ id: "prod_02", title: "Creatina", handle: "creatina", metadata: { order: 1 } }),
      buildStoreProduct({ id: "prod_03", title: "Draft", handle: "draft", status: "draft" }),
    ]);

    const products = await getMedusaCommerceProducts();

    expect(products).toHaveLength(1);
    expect(products[0]?.slug).toBe("creatina");
  });

  it("retrieves a product by handle using the Medusa layer", async () => {
    medusaProductsMocks.getMedusaStoreProductByHandle.mockResolvedValue(
      buildStoreProduct({ handle: "botella" }),
    );

    const product = await getMedusaCommerceProductBySlug("botella");

    expect(product?.slug).toBe("botella");
    expect(medusaProductsMocks.getMedusaStoreProductByHandle).toHaveBeenCalledWith("botella");
  });
});
