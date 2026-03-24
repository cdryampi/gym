import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCartAmount } from "@/lib/cart/format";
import {
  getPickupRequestPaymentTone,
  pickupRequestPaymentStatusLabels,
} from "@/lib/cart/pickup-request";
import { getPickupRequestById } from "@/lib/data/pickup-requests";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) {
    return "Sin registro";
  }

  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function CartConfirmationPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const pickupRequest = await getPickupRequestById(id);

  if (!pickupRequest) {
    notFound();
  }

  return (
    <section className="section-shell py-16">
      <div className="border border-emerald-200 bg-white px-6 py-12 shadow-[0_24px_70px_-54px_rgba(17,17,17,0.35)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
          Pago confirmado
        </p>
        <h1 className="mt-4 font-display text-4xl uppercase text-[#111111]">
          Tu pedido para recogida ya está registrado
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#4b5563]">
          Referencia <strong>{pickupRequest.requestNumber}</strong>. Hemos confirmado el pago y
          enviaremos todas las actualizaciones a <strong>{pickupRequest.email}</strong>.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="border border-black/8 bg-[#fbfbf8] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
              Total del pedido
            </p>
            <p className="mt-2 text-lg font-semibold text-[#111111]">
              {formatCartAmount(pickupRequest.total, pickupRequest.currencyCode)}
            </p>
            {pickupRequest.chargedCurrencyCode && pickupRequest.chargedTotal !== null ? (
              <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                Cargo PayPal:{" "}
                <strong>
                  {formatCartAmount(
                    pickupRequest.chargedTotal,
                    pickupRequest.chargedCurrencyCode,
                  )}
                </strong>
              </p>
            ) : null}
          </div>
          <div className="border border-black/8 bg-[#fbfbf8] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
              Pago
            </p>
            <div className="mt-2">
              <Badge variant={getPickupRequestPaymentTone(pickupRequest.paymentStatus)}>
                {pickupRequestPaymentStatusLabels[pickupRequest.paymentStatus]}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#5f6368]">
              {pickupRequest.paymentProvider ?? "paypal"}
            </p>
          </div>
          <div className="border border-black/8 bg-[#fbfbf8] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
              Confirmado
            </p>
            <p className="mt-2 text-sm font-semibold text-[#111111]">
              {formatDate(pickupRequest.paymentCapturedAt ?? pickupRequest.createdAt)}
            </p>
          </div>
        </div>

        {pickupRequest.exchangeRate ? (
          <div className="mt-4 border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-7 text-sky-900">
            Tipo de cambio aplicado: <strong>S/ {pickupRequest.exchangeRate.toFixed(3)} por USD</strong>.
            {pickupRequest.exchangeRateSource ? ` Fuente: ${pickupRequest.exchangeRateSource}.` : ""}
            {pickupRequest.exchangeRateReference
              ? ` Referencia usada: ${pickupRequest.exchangeRateReference}.`
              : ""}
          </div>
        ) : null}

        <div className="mt-8 border border-black/8 bg-[#fbfbf8] p-5 text-sm leading-7 text-[#4b5563]">
          Tu pedido queda en modalidad <strong>recogida local</strong>. No hace falta dirección de
          envío. El equipo de Nova Forza te avisará cuando esté listo para pasar por el club.
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/tienda">Seguir comprando</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/mi-cuenta">Ver mi cuenta</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
