import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const initRouteMocks = vi.hoisted(() => ({
  resolveCartIdFromRequest: vi.fn(),
  preparePayPalCheckout: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  createCheckoutTrace: vi.fn(),
}));

vi.mock("@/lib/cart/member-bridge", () => ({
  resolveCartIdFromRequest: initRouteMocks.resolveCartIdFromRequest,
}));

vi.mock("@/lib/cart/paypal-checkout", () => ({
  preparePayPalCheckout: initRouteMocks.preparePayPalCheckout,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: initRouteMocks.createSupabaseServerClient,
}));

vi.mock("@/lib/paypal/checkout-trace", () => ({
  createCheckoutTrace: initRouteMocks.createCheckoutTrace,
}));

import { POST } from "@/app/api/cart/checkout/paypal/init/route";

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

describe("POST /api/cart/checkout/paypal/init", () => {
  beforeEach(() => {
    initRouteMocks.createCheckoutTrace.mockReturnValue(buildTrace());
    initRouteMocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: null,
          },
        }),
      },
    });
    initRouteMocks.resolveCartIdFromRequest.mockResolvedValue("cart_01");
    initRouteMocks.preparePayPalCheckout.mockResolvedValue({
      cart: {
        paymentSession: {
          id: "pay_sess_01",
          paypalOrderId: "paypal_order_01",
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("prepares a valid PayPal session for a PEN cart with USD quote", async () => {
    const response = await POST(
      new Request("http://localhost/api/cart/checkout/paypal/init", {
        method: "POST",
        body: JSON.stringify({
          cartId: "cart_01",
          email: "socio@gym.com",
          notes: "Pasaré por recepción.",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(initRouteMocks.preparePayPalCheckout).toHaveBeenCalledWith({
      cartId: "cart_01",
      email: "socio@gym.com",
      notes: "Pasaré por recepción.",
      user: null,
      trace: expect.any(Object),
    });
    expect(payload.cart.paymentSession.paypalOrderId).toBe("paypal_order_01");
  });

  it("returns an explicit error when a product is missing paypal_price_usd", async () => {
    initRouteMocks.preparePayPalCheckout.mockRejectedValue(
      new Error("Falta configurar el precio estimado PayPal en USD para: Straps."),
    );

    const response = await POST(
      new Request("http://localhost/api/cart/checkout/paypal/init", {
        method: "POST",
        body: JSON.stringify({
          cartId: "cart_01",
          email: "socio@gym.com",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: "Falta configurar el precio estimado PayPal en USD para: Straps.",
    });
  });
});
