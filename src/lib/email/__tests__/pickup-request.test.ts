import { beforeEach, describe, expect, it, vi } from "vitest";

const pickupEmailMocks = vi.hoisted(() => ({
  sendMailjetEmail: vi.fn(),
}));

vi.mock("@/lib/email/mailjet", () => ({
  sendMailjetEmail: pickupEmailMocks.sendMailjetEmail,
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
    pickupEmailMocks.sendMailjetEmail.mockReset();
  });

  it("sends both customer and internal emails with escaped invoice-style content", async () => {
    pickupEmailMocks.sendMailjetEmail.mockResolvedValue({ Messages: [{ Status: "success" }] });
    const pickupRequest = buildPickupRequest();

    await sendPickupRequestEmails({
      pickupRequest,
      siteName: "Nova Forza",
      internalRecipient: "club@novaforza.pe",
      fromEmail: "Nova Forza <mailer@yampi.eu>",
      replyTo: "pedidos@gmail.com",
    });

    expect(pickupEmailMocks.sendMailjetEmail).toHaveBeenCalledTimes(2);
    expect(pickupEmailMocks.sendMailjetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Nova Forza <mailer@yampi.eu>",
        replyTo: "pedidos@gmail.com",
        to: "socio@gym.com",
        subject: "Nova Forza | Pedido pagado NF-20260322-ABC123",
        customId: "pickup-request:pick_01:customer",
        html: expect.stringMatching(/Tu pedido pagado para recogida[\s\S]*Cargo PayPal/),
        text: expect.stringContaining("Recogida local, pago online confirmado."),
      }),
    );
    expect(pickupEmailMocks.sendMailjetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Nova Forza <mailer@yampi.eu>",
        replyTo: "pedidos@gmail.com",
        to: "club@novaforza.pe",
        subject: "Nova Forza | Nuevo pedido pagado NF-20260322-ABC123",
        customId: "pickup-request:pick_01:internal",
        html: expect.stringContaining("Pasare despues de las 19:00 &lt;gracias&gt;"),
        text: expect.stringContaining("Cargo PayPal:"),
      }),
    );
  });

  it("deduplicates recipients when customer and gym email are the same", async () => {
    pickupEmailMocks.sendMailjetEmail.mockResolvedValue({ Messages: [{ Status: "success" }] });

    await sendPickupRequestEmails({
      pickupRequest: buildPickupRequest({ email: "club@novaforza.pe" }),
      siteName: "Nova Forza",
      internalRecipient: "club@novaforza.pe",
      fromEmail: "Nova Forza <mailer@yampi.eu>",
      replyTo: "pedidos@gmail.com",
    });

    expect(pickupEmailMocks.sendMailjetEmail).toHaveBeenCalledTimes(1);
  });

  it("does not fail the whole flow when only the internal email fails", async () => {
    pickupEmailMocks.sendMailjetEmail
      .mockResolvedValueOnce({ Messages: [{ Status: "success" }] })
      .mockRejectedValueOnce(new Error("Mailjet timeout"));

    await expect(
      sendPickupRequestEmails({
        pickupRequest: buildPickupRequest(),
        siteName: "Nova Forza",
        internalRecipient: "club@novaforza.pe",
        fromEmail: "Nova Forza <mailer@yampi.eu>",
        replyTo: "pedidos@gmail.com",
      }),
    ).resolves.toBeUndefined();

    expect(pickupEmailMocks.sendMailjetEmail).toHaveBeenCalledTimes(2);
  });

  it("fails when the customer email cannot be delivered", async () => {
    pickupEmailMocks.sendMailjetEmail
      .mockRejectedValueOnce(new Error("Mailjet timeout"))
      .mockResolvedValueOnce({ Messages: [{ Status: "success" }] });

    await expect(
      sendPickupRequestEmails({
        pickupRequest: buildPickupRequest(),
        siteName: "Nova Forza",
        internalRecipient: "club@novaforza.pe",
        fromEmail: "Nova Forza <mailer@yampi.eu>",
        replyTo: "pedidos@gmail.com",
      }),
    ).rejects.toThrow("Mailjet timeout");
  });

  it("fails early when the pickup request has no customer email", async () => {
    pickupEmailMocks.sendMailjetEmail.mockResolvedValue({ Messages: [{ Status: "success" }] });

    await expect(
      sendPickupRequestEmails({
        pickupRequest: buildPickupRequest({ email: "" }),
        siteName: "Nova Forza",
        internalRecipient: "club@novaforza.pe",
        fromEmail: "Nova Forza <mailer@yampi.eu>",
        replyTo: "pedidos@gmail.com",
      }),
    ).rejects.toThrow("La solicitud pickup no tiene email de cliente.");
  });
});
