import { afterEach, describe, expect, it, vi } from "vitest";

import type { Cart } from "@/lib/cart/types";
import { resolvePayPalChargeQuote } from "@/lib/paypal/quote";

const commerceMocks = vi.hoisted(() => ({
  getMedusaCommerceProductBySlug: vi.fn(),
}));

vi.mock("@/lib/commerce/medusa", () => ({
  getMedusaCommerceProductBySlug: commerceMocks.getMedusaCommerceProductBySlug,
}));

function buildCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: "cart_01",
    email: null,
    customerId: null,
    regionId: "reg_test",
    completedAt: null,
    metadata: null,
    paymentSession: null,
    items: [
      {
        id: "line_01",
        title: "Nova Whey",
        thumbnail: null,
        quantity: 2,
        productId: "prod_01",
        productTitle: "Nova Whey",
        productHandle: "nova-whey",
        variantId: "variant_01",
        variantTitle: "Chocolate",
        variantSku: null,
        unitPrice: 49.99,
        subtotal: 99.98,
        total: 99.98,
        currencyCode: "PEN",
        requiresShipping: false,
        selectedOptions: [],
      },
    ],
    summary: {
      currencyCode: "PEN",
      itemCount: 2,
      subtotal: 99.98,
      total: 99.98,
      taxTotal: 0,
      shippingTotal: 0,
      discountTotal: 0,
      requiresShipping: false,
      pickupRequestStatus: "draft",
      pickupRequestedAt: null,
      pickupRequestId: null,
      pickupRequestNumber: null,
    },
    ...overrides,
  };
}

describe("paypal charge quote", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    commerceMocks.getMedusaCommerceProductBySlug.mockReset();
  });

  it("sums the USD amount configured in the catalog for the cart items", async () => {
    commerceMocks.getMedusaCommerceProductBySlug.mockResolvedValue({
      id: "prod_01",
      slug: "nova-whey",
      name: "Nova Whey",
      category: "suplementos",
      short_description: "Proteina premium",
      description: "Descripcion larga",
      price: 49.99,
      paypal_price_usd: 13.95,
      currency: "PEN",
      stock_status: "in_stock",
      pickup_only: true,
      featured: true,
      images: [],
      tags: [],
      highlights: [],
      cta_label: "Reservar",
      order: 1,
      active: true,
    });

    const quote = await resolvePayPalChargeQuote(buildCart());

    expect(quote).toEqual({
      displayCurrencyCode: "PEN",
      displayAmount: 99.98,
      chargeCurrencyCode: "USD",
      chargeAmount: 27.9,
      exchangeRate: null,
      exchangeRateSource: null,
      exchangeRateReference: null,
    });
  });

  it("fails when a cart product has no USD amount configured", async () => {
    commerceMocks.getMedusaCommerceProductBySlug.mockResolvedValue({
      id: "prod_01",
      slug: "nova-whey",
      name: "Nova Whey",
      category: "suplementos",
      short_description: "Proteina premium",
      description: "Descripcion larga",
      price: 49.99,
      paypal_price_usd: null,
      currency: "PEN",
      stock_status: "in_stock",
      pickup_only: true,
      featured: true,
      images: [],
      tags: [],
      highlights: [],
      cta_label: "Reservar",
      order: 1,
      active: true,
    });

    await expect(resolvePayPalChargeQuote(buildCart())).rejects.toThrow(
      "Falta configurar el precio estimado PayPal en USD",
    );
  });
});
