import { describe, expect, it, vi } from "vitest";

const paypalCheckoutMocks = vi.hoisted(() => ({
  retrievePickupRequest: vi.fn(),
  listPickupRequests: vi.fn(),
  retrieveOrderByCartId: vi.fn(),
  syncPickupRequestFromOrder: vi.fn(),
  retrieveCart: vi.fn(),
}));

vi.mock("@/lib/cart/member-bridge", () => ({
  attachCartToMember: vi.fn(),
  listPickupRequests: paypalCheckoutMocks.listPickupRequests,
  markPickupRequestEmailResult: vi.fn(),
  resolveOrCreateMemberCommerceCustomer: vi.fn(),
  retrieveOrderByCartId: paypalCheckoutMocks.retrieveOrderByCartId,
  retrievePickupRequest: paypalCheckoutMocks.retrievePickupRequest,
  syncPickupRequestFromOrder: paypalCheckoutMocks.syncPickupRequestFromOrder,
}));

vi.mock("@/lib/cart/medusa", () => ({
  addFirstAvailableShippingMethod: vi.fn(),
  completeCart: vi.fn(),
  initiatePayPalPaymentSession: vi.fn(),
  retrieveCart: paypalCheckoutMocks.retrieveCart,
  updateCartEmail: vi.fn(),
  updateCartMetadata: vi.fn(),
}));

vi.mock("@/lib/data/site", () => ({
  getMarketingData: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasResendEnv: vi.fn(),
}));

vi.mock("@/lib/email/pickup-request", () => ({
  sendPickupRequestEmails: vi.fn(),
}));

vi.mock("@/lib/medusa/paypal-admin", () => ({
  ensurePayPalProviderEnabledForRegion: vi.fn(),
}));

vi.mock("@/lib/medusa/paypal-provider", () => ({
  isPayPalPaymentProviderId: vi.fn(),
}));

vi.mock("@/lib/paypal/checkout-trace", () => ({
  createCheckoutTrace: vi.fn(),
}));

vi.mock("@/lib/paypal/quote", () => ({
  resolvePayPalChargeQuote: vi.fn(),
}));

import { recoverCompletedPickupCheckout } from "@/lib/cart/paypal-checkout";

describe("recoverCompletedPickupCheckout", () => {
  it("uses the cart payment session order id before falling back to bridge routes", async () => {
    paypalCheckoutMocks.retrievePickupRequest.mockRejectedValue(new Error("missing"));
    paypalCheckoutMocks.listPickupRequests.mockRejectedValue(new Error("bridge missing"));
    paypalCheckoutMocks.retrieveOrderByCartId.mockRejectedValue(new Error("bridge missing"));
    paypalCheckoutMocks.retrieveCart.mockResolvedValue({
      id: "cart_01",
      email: "socio@gym.com",
      customerId: null,
      regionId: "reg_01",
      completedAt: "2026-03-26T06:00:00.000Z",
      metadata: null,
      items: [],
      paymentSession: {
        id: "pay_01",
        providerId: "pp_paypal_payments",
        status: "authorized",
        amount: 19.9,
        currencyCode: "USD",
        displayAmount: 74.9,
        displayCurrencyCode: "PEN",
        exchangeRate: null,
        exchangeRateSource: null,
        exchangeRateReference: null,
        orderId: "order_01",
        authorizationId: null,
        captureId: null,
        data: {},
      },
      summary: {
        currencyCode: "PEN",
        itemCount: 1,
        subtotal: 74.9,
        total: 74.9,
        taxTotal: 0,
        shippingTotal: 0,
        discountTotal: 0,
        requiresShipping: true,
        pickupRequestStatus: "draft",
        pickupRequestedAt: null,
        pickupRequestId: null,
        pickupRequestNumber: null,
      },
    });
    paypalCheckoutMocks.syncPickupRequestFromOrder.mockResolvedValue({
      pickup_request: {
        id: "pick_01",
        request_number: "NF-PAY-000099",
        cart_id: "cart_01",
        email: "socio@gym.com",
        status: "requested",
        currency_code: "PEN",
        item_count: 1,
        subtotal: 74.9,
        total: 74.9,
        line_items_snapshot: [],
        source: "gym-storefront",
        order_id: "order_01",
        payment_status: "authorized",
        email_status: "pending",
        created_at: "2026-03-26T06:00:00.000Z",
        updated_at: "2026-03-26T06:00:00.000Z",
      },
    });

    const result = await recoverCompletedPickupCheckout(
      "cart_01",
      null,
      "Checkout ya en progreso",
      {
        supabaseUserId: "user_01",
        notes: "Test",
      },
    );

    expect(paypalCheckoutMocks.syncPickupRequestFromOrder).toHaveBeenCalledWith("cart_01", {
      orderId: "order_01",
      supabaseUserId: "user_01",
      notes: "Test",
    });
    expect(paypalCheckoutMocks.retrieveOrderByCartId).not.toHaveBeenCalled();
    expect(result?.orderId).toBe("order_01");
  });
});
