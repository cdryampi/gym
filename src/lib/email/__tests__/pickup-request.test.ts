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
    chargedCurrencyCode: "USD",
    chargedTotal: 29.6,
    exchangeRate: 3.377,
    exchangeRateSource: "BCRP PD04640PD",
    exchangeRateReference: "19.Mar.26",
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
    orderId: null,
    paymentCollectionId: null,
    paymentProvider: null,
    paymentStatus: "pending",
    paypalOrderId: null,
    paypalCaptureId: null,
    paymentAuthorizedAt: null,
    paymentCapturedAt: null,
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
      fromEmail: "Nova Forza <onboarding@resend.dev>",
      replyTo: "pedidos@gmail.com",
    });

    expect(pickupEmailMocks.sendResendEmail).toHaveBeenCalledTimes(2);
    expect(pickupEmailMocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Nova Forza <onboarding@resend.dev>",
        replyTo: "pedidos@gmail.com",
        to: "socio@gym.com",
        subject: "Nova Forza | Pedido pagado NF-20260322-ABC123",
        html: expect.stringMatching(/Tu pedido pagado para recogida[\s\S]*Cargo PayPal/),
        text: expect.stringContaining("Recogida local, pago online confirmado."),
      }),
    );
    expect(pickupEmailMocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Nova Forza <onboarding@resend.dev>",
        replyTo: "pedidos@gmail.com",
        to: "club@novaforza.pe",
        subject: "Nova Forza | Nuevo pedido pagado NF-20260322-ABC123",
        html: expect.stringContaining("Pasare despues de las 19:00 &lt;gracias&gt;"),
        text: expect.stringContaining("Cargo PayPal:"),
      }),
    );
  });

  it("deduplicates recipients when customer and gym email are the same", async () => {
    pickupEmailMocks.sendResendEmail.mockResolvedValue({ id: "re_same" });

    await sendPickupRequestEmails({
      pickupRequest: buildPickupRequest({ email: "club@novaforza.pe" }),
      siteName: "Nova Forza",
      internalRecipient: "club@novaforza.pe",
      fromEmail: "Nova Forza <onboarding@resend.dev>",
      replyTo: "pedidos@gmail.com",
    });

    expect(pickupEmailMocks.sendResendEmail).toHaveBeenCalledTimes(1);
  });

  it("does not fail the whole flow when only the internal email fails", async () => {
    pickupEmailMocks.sendResendEmail
      .mockResolvedValueOnce({ id: "re_customer" })
      .mockRejectedValueOnce(new Error("Resend timeout"));

    await expect(
      sendPickupRequestEmails({
        pickupRequest: buildPickupRequest(),
        siteName: "Nova Forza",
        internalRecipient: "club@novaforza.pe",
        fromEmail: "Nova Forza <onboarding@resend.dev>",
        replyTo: "pedidos@gmail.com",
      }),
    ).resolves.toBeUndefined();

    expect(pickupEmailMocks.sendResendEmail).toHaveBeenCalledTimes(2);
  });

  it("fails when the customer email cannot be delivered", async () => {
    pickupEmailMocks.sendResendEmail
      .mockRejectedValueOnce(new Error("Resend timeout"))
      .mockResolvedValueOnce({ id: "re_internal" });

    await expect(
      sendPickupRequestEmails({
        pickupRequest: buildPickupRequest(),
        siteName: "Nova Forza",
        internalRecipient: "club@novaforza.pe",
        fromEmail: "Nova Forza <onboarding@resend.dev>",
        replyTo: "pedidos@gmail.com",
      }),
    ).rejects.toThrow("Resend timeout");
  });

  it("fails early when the pickup request has no customer email", async () => {
    pickupEmailMocks.sendResendEmail.mockResolvedValue({ id: "re_internal" });

    await expect(
      sendPickupRequestEmails({
        pickupRequest: buildPickupRequest({ email: "" }),
        siteName: "Nova Forza",
        internalRecipient: "club@novaforza.pe",
        fromEmail: "Nova Forza <onboarding@resend.dev>",
        replyTo: "pedidos@gmail.com",
      }),
    ).rejects.toThrow("La solicitud pickup no tiene email de cliente.");
  });
});
