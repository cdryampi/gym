import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const statusRouteMocks = vi.hoisted(() => ({
  resolvePayPalCheckoutStatus: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  createCheckoutTrace: vi.fn(),
}));

vi.mock("@/lib/cart/paypal-checkout", () => ({
  CHECKOUT_MANUAL_REVIEW_MESSAGE: "Manual review",
  CHECKOUT_PROCESSING_MESSAGE: "Processing",
  CHECKOUT_STATUS_ERROR_MESSAGE: "Error state",
  resolvePayPalCheckoutStatus: statusRouteMocks.resolvePayPalCheckoutStatus,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: statusRouteMocks.createSupabaseServerClient,
}));

vi.mock("@/lib/paypal/checkout-trace", () => ({
  createCheckoutTrace: statusRouteMocks.createCheckoutTrace,
}));

import { GET } from "@/app/api/cart/checkout/paypal/status/route";

function buildTrace() {
  return {
    flush: vi.fn(),
    step: vi.fn(async (_name, runner) => runner()),
    setContext: vi.fn(),
  };
}

describe("GET /api/cart/checkout/paypal/status", () => {
  beforeEach(() => {
    statusRouteMocks.createCheckoutTrace.mockReturnValue(buildTrace());
    statusRouteMocks.createSupabaseServerClient.mockResolvedValue({
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

  it("returns 400 when no cart id is provided", async () => {
    const response = await GET(new Request("http://localhost/api/cart/checkout/paypal/status"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("No se encontro un carrito");
  });

  it("returns ready when the pickup request is already available", async () => {
    statusRouteMocks.resolvePayPalCheckoutStatus.mockResolvedValue({
      status: "ready",
      pickupRequest: {
        id: "pick_01",
      },
      emailWarning: null,
    });

    const response = await GET(
      new Request("http://localhost/api/cart/checkout/paypal/status?cartId=cart_01&attempt=2"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      status: "ready",
      pickupRequestId: "pick_01",
    });
    expect(statusRouteMocks.resolvePayPalCheckoutStatus).toHaveBeenCalledWith({
      cartId: "cart_01",
      user: {
        id: "user_01",
        email: "socio@gym.com",
      },
      attempt: 2,
      trace: expect.any(Object),
    });
  });

  it("returns processing payload while the order is still being projected", async () => {
    statusRouteMocks.resolvePayPalCheckoutStatus.mockResolvedValue({
      status: "processing",
      message: "Processing",
    });

    const response = await GET(
      new Request("http://localhost/api/cart/checkout/paypal/status?cartId=cart_01&attempt=1"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      status: "processing",
      message: "Processing",
    });
  });

  it("returns manual review payload when the checkout needs operator follow-up", async () => {
    statusRouteMocks.resolvePayPalCheckoutStatus.mockResolvedValue({
      status: "pending_manual_review",
      message: "Manual review",
    });

    const response = await GET(
      new Request("http://localhost/api/cart/checkout/paypal/status?cartId=cart_01&attempt=6"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      status: "pending_manual_review",
      message: "Manual review",
    });
  });

  it("returns a terminal error when the reference is no longer recoverable", async () => {
    statusRouteMocks.resolvePayPalCheckoutStatus.mockResolvedValue({
      status: "error",
      message: "Invalid reference",
    });

    const response = await GET(
      new Request("http://localhost/api/cart/checkout/paypal/status?cartId=cart_missing&attempt=2"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      status: "error",
      message: "Invalid reference",
    });
  });

  it("returns a structured error payload when the status check crashes", async () => {
    statusRouteMocks.resolvePayPalCheckoutStatus.mockRejectedValue(
      new Error("Medusa timeout"),
    );

    const response = await GET(
      new Request("http://localhost/api/cart/checkout/paypal/status?cartId=cart_01"),
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      status: "error",
      message: "Error state",
      detail: "Medusa timeout",
    });
  });
});
