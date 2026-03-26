import { formatCartAmount } from "@/lib/cart/format";
import type { PickupRequestDetail } from "@/lib/cart/types";

import { sendResendEmail } from "./resend";

interface PickupRequestEmailContext {
  pickupRequest: PickupRequestDetail;
  siteName: string;
  internalRecipient: string;
  fromEmail?: string | null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPickupDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function renderLineItemsTable(pickupRequest: PickupRequestDetail) {
  return pickupRequest.lineItems
    .map((lineItem) => {
      const options =
        lineItem.selectedOptions.length > 0
          ? `<div style="margin-top:6px;color:#6b7280;font-size:12px;">${lineItem.selectedOptions
              .map((option) =>
                escapeHtml(
                  option.optionTitle ? `${option.optionTitle}: ${option.value}` : option.value,
                ),
              )
              .join(" · ")}</div>`
          : "";

      return `
        <tr>
          <td style="padding:14px 12px;border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:600;color:#111111;">${escapeHtml(lineItem.title)}</div>
            ${options}
          </td>
          <td style="padding:14px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;">
            ${lineItem.quantity}
          </td>
          <td style="padding:14px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#111111;font-weight:600;">
            ${escapeHtml(formatCartAmount(lineItem.total, pickupRequest.currencyCode))}
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderChargeSummary(pickupRequest: PickupRequestDetail) {
  if (!pickupRequest.chargedCurrencyCode || pickupRequest.chargedTotal === null) {
    return "";
  }

  const exchangeRate =
    pickupRequest.exchangeRate !== null
      ? `<div style="display:flex;justify-content:space-between;margin-top:10px;color:#374151;">
          <span>Tipo de cambio aplicado</span>
          <strong>S/ ${escapeHtml(pickupRequest.exchangeRate.toFixed(3))} por USD</strong>
        </div>`
      : "";
  const metadata = [pickupRequest.exchangeRateSource, pickupRequest.exchangeRateReference]
    .filter(Boolean)
    .join(" | ");
  const metadataHtml = metadata
    ? `<div style="margin-top:10px;font-size:12px;line-height:1.7;color:#6b7280;">${escapeHtml(metadata)}</div>`
    : "";

  return `
    <div style="margin-top:16px;padding-top:16px;border-top:1px dashed #d1d5db;">
      <div style="display:flex;justify-content:space-between;color:#374151;">
        <span>Cargo PayPal</span>
        <strong>${escapeHtml(
          formatCartAmount(pickupRequest.chargedTotal, pickupRequest.chargedCurrencyCode),
        )}</strong>
      </div>
      ${exchangeRate}
      ${metadataHtml}
    </div>
  `;
}

function buildPickupRequestHtml(
  pickupRequest: PickupRequestDetail,
  siteName: string,
  heading: string,
  lead: string,
) {
  const note = pickupRequest.notes
    ? `<div style="margin-top:16px;padding:16px;border:1px solid #e5e7eb;background:#faf7f2;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:#6b7280;">Nota de recogida</div>
        <p style="margin:10px 0 0;color:#374151;line-height:1.7;">${escapeHtml(pickupRequest.notes)}</p>
      </div>`
    : "";

  return `
    <div style="margin:0;padding:32px;background:#f5f5f0;font-family:Arial,sans-serif;color:#111111;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;">
        <div style="padding:32px;border-bottom:4px solid #d71920;">
          <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;font-weight:700;color:#d71920;">${escapeHtml(siteName)}</div>
          <h1 style="margin:14px 0 0;font-size:32px;line-height:1.1;text-transform:uppercase;">${escapeHtml(heading)}</h1>
          <p style="margin:16px 0 0;color:#4b5563;line-height:1.8;">${escapeHtml(lead)}</p>
        </div>

        <div style="padding:32px;">
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
            <div style="padding:16px;border:1px solid #e5e7eb;background:#fbfbf8;">
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:#6b7280;">Numero</div>
              <div style="margin-top:8px;font-size:20px;font-weight:700;">${escapeHtml(pickupRequest.requestNumber)}</div>
            </div>
            <div style="padding:16px;border:1px solid #e5e7eb;background:#fbfbf8;">
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:#6b7280;">Fecha</div>
              <div style="margin-top:8px;font-size:16px;font-weight:600;">${escapeHtml(formatPickupDate(pickupRequest.createdAt))}</div>
            </div>
            <div style="padding:16px;border:1px solid #e5e7eb;background:#fbfbf8;">
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:#6b7280;">Email</div>
              <div style="margin-top:8px;font-size:16px;font-weight:600;">${escapeHtml(pickupRequest.email)}</div>
            </div>
            <div style="padding:16px;border:1px solid #e5e7eb;background:#fbfbf8;">
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:#6b7280;">Recogida</div>
              <div style="margin-top:8px;font-size:16px;font-weight:600;">Local, pago confirmado online</div>
            </div>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-top:28px;">
            <thead>
              <tr style="background:#faf7f2;">
                <th style="padding:12px;text-align:left;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">Producto</th>
                <th style="padding:12px;text-align:center;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">Cantidad</th>
                <th style="padding:12px;text-align:right;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${renderLineItemsTable(pickupRequest)}
            </tbody>
          </table>

          ${note}

          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;">
            <div style="display:flex;justify-content:space-between;margin-top:8px;color:#374151;">
              <span>Subtotal</span>
              <strong>${escapeHtml(formatCartAmount(pickupRequest.subtotal, pickupRequest.currencyCode))}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:18px;color:#111111;">
              <span style="font-weight:700;">Total estimado</span>
              <strong>${escapeHtml(formatCartAmount(pickupRequest.total, pickupRequest.currencyCode))}</strong>
            </div>
            ${renderChargeSummary(pickupRequest)}
          </div>

          <div style="margin-top:24px;padding:18px;border:1px solid #fee2e2;background:#fff7f7;color:#4b5563;line-height:1.8;">
            Este email es un resumen comercial del pedido ya pagado para recogida local. No es una factura fiscal,
            pero si confirma que el pago online se ha registrado correctamente y que el equipo preparara tu pedido.
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildPickupRequestText(pickupRequest: PickupRequestDetail, siteName: string) {
  const lineItems = pickupRequest.lineItems
    .map(
      (lineItem) =>
        `- ${lineItem.title} x${lineItem.quantity} (${formatCartAmount(lineItem.total, pickupRequest.currencyCode)})`,
    )
    .join("\n");

  return [
    `${siteName} - Pedido pickup ${pickupRequest.requestNumber}`,
    `Fecha: ${formatPickupDate(pickupRequest.createdAt)}`,
    `Email: ${pickupRequest.email}`,
    "",
    "Lineas:",
    lineItems,
    "",
    `Subtotal: ${formatCartAmount(pickupRequest.subtotal, pickupRequest.currencyCode)}`,
    `Total: ${formatCartAmount(pickupRequest.total, pickupRequest.currencyCode)}`,
    pickupRequest.chargedCurrencyCode && pickupRequest.chargedTotal !== null
      ? `Cargo PayPal: ${formatCartAmount(
          pickupRequest.chargedTotal,
          pickupRequest.chargedCurrencyCode,
        )}`
      : "",
    pickupRequest.exchangeRate !== null
      ? `Tipo de cambio: S/ ${pickupRequest.exchangeRate.toFixed(3)} por USD${
          pickupRequest.exchangeRateReference
            ? ` (${pickupRequest.exchangeRateReference})`
            : ""
        }`
      : "",
    pickupRequest.notes ? `Nota: ${pickupRequest.notes}` : "",
    "",
    `Estado del pago: ${pickupRequest.paymentStatus}.`,
    "Recogida local, pago online confirmado.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendPickupRequestEmails({
  pickupRequest,
  siteName,
  internalRecipient,
  fromEmail,
}: PickupRequestEmailContext) {
  const customerSubject = `${siteName} | Pedido pagado ${pickupRequest.requestNumber}`;
  const internalSubject = `${siteName} | Nuevo pedido pagado ${pickupRequest.requestNumber}`;
  const customerHtml = buildPickupRequestHtml(
    pickupRequest,
    siteName,
    "Tu pedido pagado para recogida",
    "Hemos confirmado tu pago y este es el detalle que usaremos para prepararlo en el club.",
  );
  const internalHtml = buildPickupRequestHtml(
    pickupRequest,
    siteName,
    "Nuevo pedido pagado",
    "Se ha registrado un nuevo pedido pagado para recogida desde el storefront. Revisa el detalle y continua la operativa desde el dashboard.",
  );
  const text = buildPickupRequestText(pickupRequest, siteName);

  if (!pickupRequest.email) {
    throw new Error("La solicitud pickup no tiene email de cliente.");
  }

  const deliveries = [
    {
      kind: "customer" as const,
      recipient: pickupRequest.email,
      subject: customerSubject,
      html: customerHtml,
    },
    internalRecipient && internalRecipient !== pickupRequest.email
      ? {
          kind: "internal" as const,
          recipient: internalRecipient,
          subject: internalSubject,
          html: internalHtml,
        }
      : null,
  ].filter((delivery): delivery is NonNullable<typeof delivery> => Boolean(delivery));

  let customerFailure: string | null = null;
  let internalFailure: string | null = null;

  await Promise.all(
    deliveries.map(async (delivery) => {
      try {
        await sendResendEmail({
          to: delivery.recipient,
          from: fromEmail ?? undefined,
          subject: delivery.subject,
          html: delivery.html,
          text,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Fallo desconocido al enviar email.";

        if (delivery.kind === "customer") {
          customerFailure = message;
          return;
        }

        internalFailure = message;
      }
    }),
  );

  if (customerFailure) {
    throw new Error(customerFailure);
  }

  if (internalFailure) {
    console.warn("[Pickup Request Email] El email interno no pudo enviarse:", internalFailure);
  }
}
