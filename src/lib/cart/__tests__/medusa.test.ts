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
  addFirstAvailableShippingMethod,
  addCartLineItem,
  completeCart,
  createCart,
  deleteCartLineItem,
  initiatePayPalPaymentSession,
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

  it("initializes a PayPal payment session and returns the refreshed cart", async () => {
    const retrieveMock = vi
      .fn()
      .mockResolvedValueOnce({
        cart: buildMedusaCart(),
      })
      .mockResolvedValueOnce({
        cart: buildMedusaCart({
          payment_collection: {
            payment_sessions: [
              {
                id: "pay_sess_01",
                provider_id: "pp_paypal_paypal",
                status: "pending",
                amount: 2960,
                currency_code: "USD",
                data: {
                  order_id: "paypal_order_01",
                  display_currency_code: "PEN",
                  display_amount: 9998,
                  charge_currency_code: "USD",
                  charge_amount: 2960,
                  exchange_rate: 3.377,
                  exchange_rate_source: "BCRP PD04640PD",
                  exchange_rate_reference: "19.Mar.26",
                },
              },
            ],
          },
        }),
      });
    const initiatePaymentSessionMock = vi.fn().mockResolvedValue({
      payment_collection: {
        id: "pay_col_01",
      },
    });

    medusaCartMocks.getMedusaSdk.mockReturnValue({
      store: {
        cart: {
          retrieve: retrieveMock,
        },
        payment: {
          initiatePaymentSession: initiatePaymentSessionMock,
        },
      },
    });

    const cart = await initiatePayPalPaymentSession("cart_01", "pp_paypal_paypal", {
      charge_currency_code: "USD",
      charge_amount: 2960,
      display_currency_code: "PEN",
      display_amount: 9998,
      exchange_rate: 3.377,
      exchange_rate_source: "BCRP PD04640PD",
      exchange_rate_reference: "19.Mar.26",
    });

    expect(initiatePaymentSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cart_01",
      }),
      {
        provider_id: "pp_paypal_paypal",
        data: {
          charge_currency_code: "USD",
          charge_amount: 2960,
          display_currency_code: "PEN",
          display_amount: 9998,
          exchange_rate: 3.377,
          exchange_rate_source: "BCRP PD04640PD",
          exchange_rate_reference: "19.Mar.26",
        },
      },
      {
        fields: "*payment_sessions",
      },
    );
    expect(cart.paymentSession?.paypalOrderId).toBe("paypal_order_01");
    expect(cart.paymentSession?.currencyCode).toBe("USD");
    expect(cart.paymentSession?.amount).toBe(29.6);
    expect(cart.paymentSession?.displayCurrencyCode).toBe("PEN");
    expect(cart.paymentSession?.displayAmount).toBe(99.98);
    expect(cart.paymentSession?.exchangeRate).toBe(3.377);
  });

  it("recreates the PayPal payment session even if the cart already had an order id", async () => {
    const retrieveMock = vi
      .fn()
      .mockResolvedValueOnce({
        cart: buildMedusaCart({
          payment_collection: {
            payment_sessions: [
              {
                id: "pay_sess_old",
                provider_id: "pp_paypal_paypal",
                status: "pending",
                data: {
                  order_id: "paypal_order_old",
                },
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        cart: buildMedusaCart({
          payment_collection: {
            payment_sessions: [
              {
                id: "pay_sess_new",
                provider_id: "pp_paypal_paypal",
                status: "pending",
                amount: 2960,
                currency_code: "USD",
                data: {
                  order_id: "paypal_order_new",
                  display_currency_code: "PEN",
                  display_amount: 9998,
                  charge_currency_code: "USD",
                  charge_amount: 2960,
                },
              },
            ],
          },
        }),
      });
    const initiatePaymentSessionMock = vi.fn().mockResolvedValue({
      payment_collection: {
        id: "pay_col_01",
      },
    });

    medusaCartMocks.getMedusaSdk.mockReturnValue({
      store: {
        cart: {
          retrieve: retrieveMock,
        },
        payment: {
          initiatePaymentSession: initiatePaymentSessionMock,
        },
      },
    });

    const cart = await initiatePayPalPaymentSession("cart_01", "pp_paypal_paypal", {
      charge_currency_code: "USD",
      charge_amount: 2960,
    });

    expect(initiatePaymentSessionMock).toHaveBeenCalledTimes(1);
    expect(cart.paymentSession?.paypalOrderId).toBe("paypal_order_new");
  });

  it("reuses the cart when a shipping method is already attached", async () => {
    const retrieveMock = vi.fn().mockResolvedValue({
      cart: buildMedusaCart({
        shipping_methods: [
          {
            id: "sm_01",
            shipping_option_id: "so_pickup",
          },
        ],
      }),
    });
    const updateMock = vi.fn();
    const listCartOptionsMock = vi.fn();
    const addShippingMethodMock = vi.fn();

    medusaCartMocks.getMedusaSdk.mockReturnValue({
      store: {
        cart: {
          retrieve: retrieveMock,
          update: updateMock,
          addShippingMethod: addShippingMethodMock,
        },
        fulfillment: {
          listCartOptions: listCartOptionsMock,
        },
      },
    });

    const cart = await addFirstAvailableShippingMethod("cart_01");

    expect(cart.id).toBe("cart_01");
    expect(updateMock).not.toHaveBeenCalled();
    expect(listCartOptionsMock).not.toHaveBeenCalled();
    expect(addShippingMethodMock).not.toHaveBeenCalled();
  });

  it("skips shipping options that Medusa rejects and attaches the first valid one", async () => {
    const retrieveMock = vi.fn().mockResolvedValue({
      cart: buildMedusaCart({
        shipping_methods: [],
      }),
    });
    const updateMock = vi.fn().mockResolvedValue({
      cart: buildMedusaCart(),
    });
    const listCartOptionsMock = vi.fn().mockResolvedValue({
      shipping_options: [
        { id: "so_broken", name: "Pickup roto" },
        { id: "so_valid", name: "Pickup gratis" },
      ],
    });
    const addShippingMethodMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("Shipping option does not have a price"))
      .mockResolvedValueOnce({
        cart: buildMedusaCart({
          shipping_total: 0,
        }),
      });

    medusaCartMocks.getMedusaSdk.mockReturnValue({
      store: {
        cart: {
          retrieve: retrieveMock,
          update: updateMock,
          addShippingMethod: addShippingMethodMock,
        },
        fulfillment: {
          listCartOptions: listCartOptionsMock,
        },
      },
    });

    await addFirstAvailableShippingMethod("cart_01");

    expect(updateMock).toHaveBeenCalledWith("cart_01", {
      shipping_address: { country_code: "pe" },
    });
    expect(addShippingMethodMock).toHaveBeenNthCalledWith(
      1,
      "cart_01",
      {
        option_id: "so_broken",
      },
      expect.objectContaining({
        fields: expect.stringContaining("shipping_methods.id"),
      }),
    );
    expect(addShippingMethodMock).toHaveBeenNthCalledWith(
      2,
      "cart_01",
      {
        option_id: "so_valid",
      },
      expect.objectContaining({
        fields: expect.stringContaining("shipping_methods.id"),
      }),
    );
  });

  it("throws a clear error when every shipping option is unpriced", async () => {
    const retrieveMock = vi.fn().mockResolvedValue({
      cart: buildMedusaCart({
        shipping_methods: [],
      }),
    });
    const updateMock = vi.fn().mockResolvedValue({
      cart: buildMedusaCart(),
    });
    const listCartOptionsMock = vi.fn().mockResolvedValue({
      shipping_options: [{ id: "so_broken", name: "Pickup roto" }],
    });
    const addShippingMethodMock = vi
      .fn()
      .mockRejectedValue(new Error("Shipping option does not have a price"));

    medusaCartMocks.getMedusaSdk.mockReturnValue({
      store: {
        cart: {
          retrieve: retrieveMock,
          update: updateMock,
          addShippingMethod: addShippingMethodMock,
        },
        fulfillment: {
          listCartOptions: listCartOptionsMock,
        },
      },
    });

    await expect(addFirstAvailableShippingMethod("cart_01")).rejects.toThrow(
      "Medusa devolvió métodos de envío sin precio",
    );
    expect(addShippingMethodMock).toHaveBeenCalledTimes(1);
    expect(addShippingMethodMock).toHaveBeenCalledWith(
      "cart_01",
      {
        option_id: "so_broken",
      },
      expect.objectContaining({
        fields: expect.stringContaining("shipping_methods.id"),
      }),
    );
  });

  it("returns the successful order payload when Medusa completes the cart", async () => {
    const completeMock = vi.fn().mockResolvedValue({
      type: "order",
      order: {
        id: "order_01",
        display_id: 17,
      },
    });

    medusaCartMocks.getMedusaSdk.mockReturnValue({
      store: {
        cart: {
          complete: completeMock,
        },
      },
    });

    const result = await completeCart("cart_01");

    expect(result).toEqual({
      type: "order",
      order: {
        id: "order_01",
        display_id: 17,
      },
    });
  });

  it("returns the cart error payload when completion still needs action", async () => {
    const completeMock = vi.fn().mockResolvedValue({
      type: "cart",
      cart: buildMedusaCart(),
      error: {
        message: "PayPal still needs approval.",
      },
    });

    medusaCartMocks.getMedusaSdk.mockReturnValue({
      store: {
        cart: {
          complete: completeMock,
        },
      },
    });

    const result = await completeCart("cart_01");

    expect(result).toEqual({
      type: "cart",
      cart: buildMedusaCart(),
      error: "PayPal still needs approval.",
    });
  });

  it("surfaces a checkout-in-progress error when Medusa reports a conflict", async () => {
    const completeMock = vi
      .fn()
      .mockRejectedValueOnce(
        new Error(
          "The request conflicted with another request. You may retry the request with the provided Idempotency-Key.",
        ),
      );

    medusaCartMocks.getMedusaSdk.mockReturnValue({
      store: {
        cart: {
          complete: completeMock,
        },
      },
    });

    await expect(
      completeCart("cart_01", {
        idempotencyKey: "paypal-complete:cart_01:order_abc",
      }),
    ).rejects.toThrow("Checkout ya en progreso");

    expect(completeMock).toHaveBeenCalledTimes(1);
    expect(completeMock).toHaveBeenCalledWith("cart_01", undefined, {
      "Idempotency-Key": "paypal-complete:cart_01:order_abc",
    });
  });
});
