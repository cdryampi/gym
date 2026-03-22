import { beforeEach, describe, expect, it, vi } from "vitest";

const pickupEmailMocks = vi.hoisted(() => ({
  sendResendEmail: vi.fn(),
}));

vi.mock("@/lib/email/resend", () => ({
  sendResendEmail: pickupEmailMocks.sendResendEmail,
}));

import { sendPickupRequestEmails } from "@/lib/email/pickup-request";
import type { PickupRequestDetail } from "@/lib/cart/types";

function buildPickupRequest(overrides: Partial<PickupRequestDetail> = {}): PickupRequestDetail {
  return {
    id: "pick_01",
    requestNumber: "NF-20260322-ABC123",
    cartId: "cart_01",
    customerId: "cus_01",
    supabaseUserId: "user_01",
    email: "socio@gym.com",
    notes: "Pasare despues de las 19:00 <gracias>",
    status: "requested",
    currencyCode: "PEN",
    itemCount: 2,
    subtotal: 99.98,
    total: 99.98,
    lineItems: [
      {
        id: "line_01",
        title: "Nova Whey",
        quantity: 2,
        thumbnail: null,
        productId: "prod_01",
        productTitle: "Nova Whey",
        productHandle: "nova-whey",
        variantId: "variant_01",
        variantTitle: "Chocolate",
        variantSku: "NW-CHOCO",
        unitPrice: 49.99,
        total: 99.98,
        selectedOptions: [{ optionTitle: "Sabor", value: "Chocolate" }],
      },
    ],
    source: "gym-storefront",
    emailStatus: "pending",
    emailSentAt: null,
    emailError: null,
    createdAt: "2026-03-22T10:00:00.000Z",
    updatedAt: "2026-03-22T10:00:00.000Z",
    ...overrides,
  };
}

describe("pickup request emails", () => {
  beforeEach(() => {
    pickupEmailMocks.sendResendEmail.mockReset();
  });

  it("sends both customer and internal emails with escaped invoice-style content", async () => {
    pickupEmailMocks.sendResendEmail.mockResolvedValue({ id: "re_01" });
    const pickupRequest = buildPickupRequest();

    await sendPickupRequestEmails({
      pickupRequest,
      siteName: "Nova Forza",
      internalRecipient: "club@novaforza.pe",
    });

    expect(pickupEmailMocks.sendResendEmail).toHaveBeenCalledTimes(2);
    expect(pickupEmailMocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "socio@gym.com",
        subject: "Nova Forza | Pedido pickup NF-20260322-ABC123",
        html: expect.stringContaining("Resumen de tu pedido pickup"),
        text: expect.stringContaining("Recogida local, sin pago online."),
      }),
    );
    expect(pickupEmailMocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "club@novaforza.pe",
        subject: "Nova Forza | Nuevo pedido pickup NF-20260322-ABC123",
        html: expect.stringContaining("Pasare despues de las 19:00 &lt;gracias&gt;"),
      }),
    );
  });

  it("deduplicates recipients when customer and gym email are the same", async () => {
    pickupEmailMocks.sendResendEmail.mockResolvedValue({ id: "re_same" });

    await sendPickupRequestEmails({
      pickupRequest: buildPickupRequest({ email: "club@novaforza.pe" }),
      siteName: "Nova Forza",
      internalRecipient: "club@novaforza.pe",
    });

    expect(pickupEmailMocks.sendResendEmail).toHaveBeenCalledTimes(1);
  });

  it("aggregates resend failures without losing the successful attempts", async () => {
    pickupEmailMocks.sendResendEmail
      .mockResolvedValueOnce({ id: "re_customer" })
      .mockRejectedValueOnce(new Error("Resend timeout"));

    await expect(
      sendPickupRequestEmails({
        pickupRequest: buildPickupRequest(),
        siteName: "Nova Forza",
        internalRecipient: "club@novaforza.pe",
      }),
    ).rejects.toThrow("Resend timeout");

    expect(pickupEmailMocks.sendResendEmail).toHaveBeenCalledTimes(2);
  });

  it("fails early when the pickup request has no customer email", async () => {
    pickupEmailMocks.sendResendEmail.mockResolvedValue({ id: "re_internal" });

    await expect(
      sendPickupRequestEmails({
        pickupRequest: buildPickupRequest({ email: "" }),
        siteName: "Nova Forza",
        internalRecipient: "club@novaforza.pe",
      }),
    ).rejects.toThrow("La solicitud pickup no tiene email de cliente.");
  });
});
