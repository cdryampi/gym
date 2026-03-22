import { describe, expect, it, vi } from "vitest";

const medusaCartMocks = vi.hoisted(() => ({
  getMedusaStorefrontConfig: vi.fn(() => ({
    backendUrl: "http://localhost:9000",
    publishableKey: "pk_test_123",
    regionId: "reg_test",
  })),
  getMedusaSdk: vi.fn(),
}));

vi.mock("@/lib/medusa/config", () => ({
  getMedusaStorefrontConfig: medusaCartMocks.getMedusaStorefrontConfig,
}));

vi.mock("@/lib/medusa/sdk", () => ({
  getMedusaSdk: medusaCartMocks.getMedusaSdk,
}));

import {
  addCartLineItem,
  createCart,
  deleteCartLineItem,
  mapMedusaCart,
  updateCartLineItem,
  type MedusaCart,
} from "@/lib/cart/medusa";

function buildMedusaCart(overrides: Partial<MedusaCart> = {}): MedusaCart {
  return {
    id: "cart_01",
    email: null,
    customer_id: null,
    region_id: "reg_test",
    completed_at: null,
    metadata: null,
    currency_code: "pen",
    subtotal: 4999,
    total: 4999,
    tax_total: 0,
    shipping_total: 0,
    discount_total: 0,
    items: [
      {
        id: "line_01",
        title: "Whey",
        product_title: "Nova Whey",
        product_handle: "nova-whey",
        quantity: 1,
        variant_id: "variant_chocolate",
        variant_title: "Chocolate",
        unit_price: 4999,
        subtotal: 4999,
        total: 4999,
        requires_shipping: false,
        variant_option_values: {
          Sabor: "Chocolate",
        },
      },
    ],
    ...overrides,
  };
}

describe("cart medusa helpers", () => {
  it("maps a Medusa cart into the storefront contract", () => {
    const cart = mapMedusaCart(
      buildMedusaCart({
        metadata: {
          pickup_request_status: "submitted",
          pickup_request_id: "pick_01",
          pickup_request_number: "NF-20260321-ABC123",
          pickup_requested_at: "2026-03-21T10:00:00.000Z",
        },
      }),
    );

    expect(cart.summary.currencyCode).toBe("PEN");
    expect(cart.summary.itemCount).toBe(1);
    expect(cart.summary.subtotal).toBe(49.99);
    expect(cart.summary.pickupRequestStatus).toBe("submitted");
    expect(cart.summary.pickupRequestId).toBe("pick_01");
    expect(cart.summary.pickupRequestNumber).toBe("NF-20260321-ABC123");
    expect(cart.items[0]?.selectedOptions).toEqual([{ optionTitle: "Sabor", value: "Chocolate" }]);
  });

  it("creates an empty cart with the configured Medusa region", async () => {
    const createMock = vi.fn().mockResolvedValue({
      cart: buildMedusaCart({
        id: "cart_empty",
        email: "guest@gym.com",
        items: [],
        subtotal: 0,
        total: 0,
      }),
    });

    medusaCartMocks.getMedusaSdk.mockReturnValue({
      store: {
        cart: {
          create: createMock,
        },
      },
    });

    const cart = await createCart("guest@gym.com");

    expect(createMock).toHaveBeenCalledWith(
      {
        region_id: "reg_test",
        email: "guest@gym.com",
      },
      expect.objectContaining({
        fields: expect.stringContaining("items.variant_title"),
      }),
    );
    expect(cart.id).toBe("cart_empty");
    expect(cart.summary.itemCount).toBe(0);
  });

  it("adds an item to the cart using the selected Medusa variant", async () => {
    const createLineItemMock = vi.fn().mockResolvedValue({
      cart: buildMedusaCart({
        items: [
          {
            id: "line_02",
            title: "Whey",
            product_title: "Nova Whey",
            product_handle: "nova-whey",
            quantity: 2,
            variant_id: "variant_vanilla",
            variant_title: "Vanilla",
            unit_price: 4999,
            subtotal: 9998,
            total: 9998,
            requires_shipping: false,
            variant_option_values: {
              Sabor: "Vanilla",
            },
          },
        ],
        subtotal: 9998,
        total: 9998,
      }),
    });

    medusaCartMocks.getMedusaSdk.mockReturnValue({
      store: {
        cart: {
          createLineItem: createLineItemMock,
        },
      },
    });

    const cart = await addCartLineItem("cart_01", "variant_vanilla", 2);

    expect(createLineItemMock).toHaveBeenCalledWith(
      "cart_01",
      {
        variant_id: "variant_vanilla",
        quantity: 2,
      },
      expect.objectContaining({
        fields: expect.stringContaining("items.variant_title"),
      }),
    );
    expect(cart.summary.itemCount).toBe(2);
    expect(cart.summary.total).toBe(99.98);
  });

  it("updates item quantities and recalculates totals", async () => {
    const updateLineItemMock = vi.fn().mockResolvedValue({
      cart: buildMedusaCart({
        items: [
          {
            id: "line_01",
            title: "Whey",
            product_title: "Nova Whey",
            product_handle: "nova-whey",
            quantity: 3,
            variant_id: "variant_chocolate",
            variant_title: "Chocolate",
            unit_price: 4999,
            subtotal: 14997,
            total: 14997,
            requires_shipping: false,
            variant_option_values: {
              Sabor: "Chocolate",
            },
          },
        ],
        subtotal: 14997,
        total: 14997,
      }),
    });

    medusaCartMocks.getMedusaSdk.mockReturnValue({
      store: {
        cart: {
          updateLineItem: updateLineItemMock,
        },
      },
    });

    const cart = await updateCartLineItem("cart_01", "line_01", 3);

    expect(updateLineItemMock).toHaveBeenCalledWith(
      "cart_01",
      "line_01",
      {
        quantity: 3,
      },
      expect.objectContaining({
        fields: expect.stringContaining("items.variant_title"),
      }),
    );
    expect(cart.items[0]?.quantity).toBe(3);
    expect(cart.summary.total).toBe(149.97);
  });

  it("removes items from the cart and returns the parent cart snapshot", async () => {
    const deleteLineItemMock = vi.fn().mockResolvedValue({
      parent: buildMedusaCart({
        items: [],
        subtotal: 0,
        total: 0,
      }),
    });

    medusaCartMocks.getMedusaSdk.mockReturnValue({
      store: {
        cart: {
          deleteLineItem: deleteLineItemMock,
        },
      },
    });

    const cart = await deleteCartLineItem("cart_01", "line_01");

    expect(deleteLineItemMock).toHaveBeenCalledWith(
      "cart_01",
      "line_01",
      expect.objectContaining({
        fields: expect.stringContaining("items.variant_title"),
      }),
    );
    expect(cart.items).toEqual([]);
    expect(cart.summary.itemCount).toBe(0);
  });
});
