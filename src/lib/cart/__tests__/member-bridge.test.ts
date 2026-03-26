import { describe, expect, it, vi } from "vitest";

const memberBridgeMocks = vi.hoisted(() => ({
  getMedusaAdminSdk: vi.fn(),
  getMemberCommerceCustomerByUserId: vi.fn(),
  upsertMemberCommerceCustomer: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  getCartIdFromRequestCookies: vi.fn(),
}));

vi.mock("@/lib/medusa/admin-sdk", () => ({
  getMedusaAdminSdk: memberBridgeMocks.getMedusaAdminSdk,
}));

vi.mock("@/lib/supabase/member-commerce", () => ({
  getMemberCommerceCustomerByUserId: memberBridgeMocks.getMemberCommerceCustomerByUserId,
  upsertMemberCommerceCustomer: memberBridgeMocks.upsertMemberCommerceCustomer,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: memberBridgeMocks.createSupabaseAdminClient,
}));

vi.mock("@/lib/cart/server", () => ({
  getCartIdFromRequestCookies: memberBridgeMocks.getCartIdFromRequestCookies,
}));

import {
  attachCartToMember,
  createPickupRequest,
  listPickupRequests,
  markPickupRequestEmailResult,
  syncPickupRequestFromOrder,
  updatePickupRequestStatus,
} from "@/lib/cart/member-bridge";

describe("member commerce bridge", () => {
  it("does not log bridge errors for expected missing-cart 404 responses", async () => {
    const fetchMock = vi.fn().mockRejectedValue({
      message: "Not Found",
      status: 404,
      statusText: "Not Found",
    });
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    memberBridgeMocks.getMedusaAdminSdk.mockReturnValue({
      client: {
        fetch: fetchMock,
      },
    });

    await expect(
      attachCartToMember("cart_01", "cus_01", "socio@gym.com"),
    ).rejects.toThrow("No se pudo vincular el carrito a la cuenta del miembro: Not Found");

    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("associates a guest cart to the resolved Medusa customer", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      cart: {
        id: "cart_01",
        customer_id: "cus_01",
      },
    });

    memberBridgeMocks.getMedusaAdminSdk.mockReturnValue({
      client: {
        fetch: fetchMock,
      },
    });

    const response = await attachCartToMember("cart_01", "cus_01", "socio@gym.com");

    expect(fetchMock).toHaveBeenCalledWith("/admin/gym/carts/attach", {
      method: "POST",
      body: {
        cart_id: "cart_01",
        customer_id: "cus_01",
        email: "socio@gym.com",
      },
    });
    expect(response.cart.customer_id).toBe("cus_01");
  });

  it("creates a pickup request from a cart snapshot", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      pickup_request: {
        id: "pick_01",
      },
    });

    memberBridgeMocks.getMedusaAdminSdk.mockReturnValue({
      client: {
        fetch: fetchMock,
      },
    });

    const response = await createPickupRequest("cart_01", {
      email: "socio@gym.com",
      customerId: "cus_01",
      supabaseUserId: "user_01",
      notes: "Pasare despues de entrenar.",
    });

    expect(fetchMock).toHaveBeenCalledWith("/admin/gym/pickup-requests", {
      method: "POST",
      body: {
        cart_id: "cart_01",
        email: "socio@gym.com",
        customer_id: "cus_01",
        supabase_user_id: "user_01",
        notes: "Pasare despues de entrenar.",
      },
    });
    expect(response.pickup_request.id).toBe("pick_01");
  });

  it("lists pickup requests with filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      pickup_requests: [],
      count: 0,
      limit: 10,
      offset: 0,
    });

    memberBridgeMocks.getMedusaAdminSdk.mockReturnValue({
      client: {
        fetch: fetchMock,
      },
    });

    await listPickupRequests({
      email: "guest@gym.com",
      status: "requested",
      limit: 10,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/admin/gym/pickup-requests?limit=10&status=requested&email=guest%40gym.com",
      { method: "GET" },
    );
  });

  it("updates pickup request status and email delivery result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      pickup_request: {
        id: "pick_01",
      },
    });

    memberBridgeMocks.getMedusaAdminSdk.mockReturnValue({
      client: {
        fetch: fetchMock,
      },
    });

    await updatePickupRequestStatus("pick_01", "confirmed");
    await markPickupRequestEmailResult("pick_01", {
      emailStatus: "sent",
      emailSentAt: "2026-03-22T12:00:00.000Z",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/admin/gym/pickup-requests/pick_01/status", {
      method: "POST",
      body: {
        status: "confirmed",
      },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/admin/gym/pickup-requests/pick_01/resend-email",
      {
        method: "POST",
        body: {
          email_status: "sent",
          email_error: undefined,
          email_sent_at: "2026-03-22T12:00:00.000Z",
        },
      },
    );
  });

  it("syncs a paid Medusa order into the pickup request projection", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      pickup_request: {
        id: "pick_paid_01",
      },
    });

    memberBridgeMocks.getMedusaAdminSdk.mockReturnValue({
      client: {
        fetch: fetchMock,
      },
    });

    const response = await syncPickupRequestFromOrder("cart_01", {
      orderId: "order_01",
      supabaseUserId: "user_01",
      notes: "Pago aprobado con PayPal.",
    });

    expect(fetchMock).toHaveBeenCalledWith("/admin/gym/pickup-requests/sync-order", {
      method: "POST",
      body: {
        cart_id: "cart_01",
        order_id: "order_01",
        paypal_order_id: undefined,
        supabase_user_id: "user_01",
        notes: "Pago aprobado con PayPal.",
      },
    });
    expect(response.pickup_request.id).toBe("pick_paid_01");
  });
});
