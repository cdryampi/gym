import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GYM_CART_COOKIE } from "@/lib/cart/cookie";

const completeRouteMocks = vi.hoisted(() => ({
  resolveCartIdFromRequest: vi.fn(),
  completePayPalCheckout: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  createCheckoutTrace: vi.fn(),
}));

vi.mock("@/lib/cart/member-bridge", () => ({
  resolveCartIdFromRequest: completeRouteMocks.resolveCartIdFromRequest,
}));

vi.mock("@/lib/cart/paypal-checkout", () => ({
  completePayPalCheckout: completeRouteMocks.completePayPalCheckout,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: completeRouteMocks.createSupabaseServerClient,
}));

vi.mock("@/lib/paypal/checkout-trace", () => ({
  createCheckoutTrace: completeRouteMocks.createCheckoutTrace,
}));

import { POST } from "@/app/api/cart/checkout/paypal/complete/route";

function buildPickupRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: "pick_01",
    requestNumber: "NF-PAY-000011",
    cartId: "cart_01",
    customerId: "cus_01",
    supabaseUserId: "user_01",
    email: "socio@gym.com",
    notes: "Pasaré por recepción.",
    status: "requested",
    currencyCode: "PEN",
    itemCount: 1,
    subtotal: 64.9,
    total: 64.9,
    chargedCurrencyCode: "USD",
    chargedTotal: 17.08,
    exchangeRate: null,
    exchangeRateSource: null,
    exchangeRateReference: null,
    lineItems: [],
    source: "gym-storefront",
    orderId: "order_01",
    paymentCollectionId: "pay_col_01",
    paymentProvider: "paypal",
    paymentStatus: "captured",
    paypalOrderId: "paypal_order_01",
    paypalCaptureId: "capture_01",
    paymentAuthorizedAt: "2026-03-24T10:00:00.000Z",
    paymentCapturedAt: "2026-03-24T10:01:00.000Z",
    emailStatus: "sent",
    emailSentAt: "2026-03-24T10:02:00.000Z",
    emailError: null,
    createdAt: "2026-03-24T10:00:00.000Z",
    updatedAt: "2026-03-24T10:01:00.000Z",
    ...overrides,
  };
}

function buildTrace() {
  return {
    step: vi.fn(async (_name, runner, getMeta) => {
      const result = await runner();
      getMeta?.(result);
      return result;
    }),
    flush: vi.fn(),
    setContext: vi.fn(),
  };
}

describe("POST /api/cart/checkout/paypal/complete", () => {
  beforeEach(() => {
    completeRouteMocks.createCheckoutTrace.mockReturnValue(buildTrace());
    completeRouteMocks.resolveCartIdFromRequest.mockResolvedValue("cart_01");
    completeRouteMocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user_01",
              email: "socio@gym.com",
            },
          },
        }),
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the projected pickup request and clears the cart cookie", async () => {
    completeRouteMocks.completePayPalCheckout.mockResolvedValue({
      kind: "success",
      pickupRequest: buildPickupRequest(),
      emailWarning: null,
    });

    const response = await POST(
      new Request("http://localhost/api/cart/checkout/paypal/complete", {
        method: "POST",
        body: JSON.stringify({
          cartId: "cart_01",
          notes: "Pasaré por recepción.",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(completeRouteMocks.completePayPalCheckout).toHaveBeenCalledWith({
      cartId: "cart_01",
      email: undefined,
      notes: "Pasaré por recepción.",
      user: {
        id: "user_01",
        email: "socio@gym.com",
      },
      trace: expect.any(Object),
    });
    expect(payload.pickupRequest.requestNumber).toBe("NF-PAY-000011");
    expect(response.headers.get("set-cookie")).toContain(`${GYM_CART_COOKIE}=`);
  });

  it("returns 409 and clears the cookie when the cart is stale", async () => {
    completeRouteMocks.completePayPalCheckout.mockResolvedValue({
      kind: "stale-cart",
      message: "Este carrito ya estaba completado. Hemos limpiado la sesión para que puedas empezar otro pedido.",
    });

    const response = await POST(
      new Request("http://localhost/api/cart/checkout/paypal/complete", {
        method: "POST",
        body: JSON.stringify({
          cartId: "cart_01",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toContain("Este carrito ya estaba completado");
    expect(response.headers.get("set-cookie")).toContain(`${GYM_CART_COOKIE}=`);
  });

  it("returns 202 when checkout is still being processed", async () => {
    completeRouteMocks.completePayPalCheckout.mockResolvedValue({
      kind: "processing",
      message: "Tu pago con PayPal se esta procesando.",
    });

    const response = await POST(
      new Request("http://localhost/api/cart/checkout/paypal/complete", {
        method: "POST",
        body: JSON.stringify({
          cartId: "cart_01",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload).toEqual({
      processing: true,
      message: "Tu pago con PayPal se esta procesando.",
      error: "Tu pago con PayPal se esta procesando.",
    });
    expect(response.headers.get("set-cookie")).toContain(`${GYM_CART_COOKIE}=`);
  });

  it("returns the checkout error when completion fails", async () => {
    completeRouteMocks.completePayPalCheckout.mockRejectedValue(
      new Error("No se pudo completar el checkout con PayPal."),
    );

    const response = await POST(
      new Request("http://localhost/api/cart/checkout/paypal/complete", {
        method: "POST",
        body: JSON.stringify({
          cartId: "cart_01",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("No se pudo completar el checkout con PayPal.");
  });
});
