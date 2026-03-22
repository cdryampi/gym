import { describe, expect, it } from "vitest";

import {
  mapPickupRequest,
  normalizePickupRequestEmailStatus,
  normalizePickupRequestStatus,
} from "@/lib/cart/pickup-request";

describe("pickup request mapper", () => {
  it("normalizes statuses with safe defaults", () => {
    expect(normalizePickupRequestStatus("confirmed")).toBe("confirmed");
    expect(normalizePickupRequestStatus("unknown")).toBe("requested");
    expect(normalizePickupRequestEmailStatus("sent")).toBe("sent");
    expect(normalizePickupRequestEmailStatus("boom")).toBe("pending");
  });

  it("maps line items, totals and email fields from Medusa payloads", () => {
    const pickupRequest = mapPickupRequest({
      id: "pick_01",
      request_number: "NF-20260322-ABC123",
      cart_id: "cart_01",
      customer_id: "cus_01",
      supabase_user_id: "user_01",
      email: "socio@gym.com",
      notes: "Pasare por la tarde.",
      status: "ready_for_pickup",
      currency_code: "pen",
      item_count: 2,
      subtotal: 99.98,
      total: 99.98,
      source: "gym-storefront",
      email_status: "failed",
      email_sent_at: "2026-03-22T12:00:00.000Z",
      email_error: "Resend timeout",
      created_at: "2026-03-22T10:00:00.000Z",
      updated_at: "2026-03-22T12:00:00.000Z",
      line_items_snapshot: [
        {
          id: "line_01",
          title: "Nova Whey",
          quantity: 2,
          unit_price: 49.99,
          total: 99.98,
          selected_options: [{ option_title: "Sabor", value: "Chocolate" }],
        },
      ],
    });

    expect(pickupRequest.requestNumber).toBe("NF-20260322-ABC123");
    expect(pickupRequest.status).toBe("ready_for_pickup");
    expect(pickupRequest.currencyCode).toBe("PEN");
    expect(pickupRequest.emailStatus).toBe("failed");
    expect(pickupRequest.emailError).toBe("Resend timeout");
    expect(pickupRequest.lineItems).toEqual([
      expect.objectContaining({
        id: "line_01",
        title: "Nova Whey",
        quantity: 2,
        unitPrice: 49.99,
        total: 99.98,
        selectedOptions: [{ optionTitle: "Sabor", value: "Chocolate" }],
      }),
    ]);
  });
});
