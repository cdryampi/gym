import Link from "next/link";
import { Clock3, Mail, ShoppingBag } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireMemberUser } from "@/lib/auth";
import { formatCartAmount } from "@/lib/cart/format";
import {
  getPickupRequestEmailTone,
  getPickupRequestPaymentTone,
  getPickupRequestStatusTone,
  pickupRequestEmailStatusLabels,
  pickupRequestPaymentStatusLabels,
  pickupRequestStatusLabels,
} from "@/lib/cart/pickup-request";
import { getMemberPickupRequestById } from "@/lib/data/pickup-requests";
import { buildPickupRequestTimeline } from "@/lib/data/pickup-request-dashboard";
import { formatMemberAccountDate } from "@/lib/member-account";

export const dynamic = "force-dynamic";

function getMemberPickupNextStep(input: {
  status: keyof typeof pickupRequestStatusLabels;
  paymentStatus: keyof typeof pickupRequestPaymentStatusLabels;
  emailStatus: keyof typeof pickupRequestEmailStatusLabels;
}) {
  if (input.paymentStatus === "requires_more") {
    return "Tu pago requiere una validacion adicional. Si no ves movimiento pronto, contacta con el club para revisar el pedido.";
  }

  if (input.paymentStatus === "error" || input.paymentStatus === "canceled") {
    return "El pago quedo con incidencia. Te conviene contactar con el club antes de volver a intentarlo.";
  }

  if (input.emailStatus === "failed") {
    return "El resumen por email no se pudo confirmar, pero tu pedido sigue registrado. El equipo del club deberia revisar la notificacion.";
  }

  switch (input.status) {
    case "requested":
      return "Tu pedido ya esta registrado. El siguiente paso es la confirmacion interna del club.";
    case "confirmed":
      return "El club ya confirmo tu pedido y lo esta preparando para la recogida.";
    case "ready_for_pickup":
      return "Tu pedido ya esta listo para recoger. Revisa horarios y pasa por el club cuando te venga bien.";
    case "fulfilled":
      return "La recogida ya quedo cerrada. Puedes volver a la tienda cuando quieras hacer otro pedido.";
    case "cancelled":
      return "El pedido fue cancelado. Si no esperabas este estado, habla con el club para aclararlo.";
    default:
      return "Sigue este pedido desde tu cuenta privada hasta que la recogida quede cerrada.";
  }
}

export default async function MemberPickupRequestDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const user = await requireMemberUser(`/acceso?next=/mi-cuenta/pedidos/${id}`);
  const pickupRequest = await getMemberPickupRequestById({
    id,
    email: user.email,
    supabaseUserId: user.id,
  });

  if (!pickupRequest) {
    notFound();
  }

  const timeline = buildPickupRequestTimeline(pickupRequest);
  const nextStep = getMemberPickupNextStep({
    status: pickupRequest.status,
    paymentStatus: pickupRequest.paymentStatus,
    emailStatus: pickupRequest.emailStatus,
  });

  return (
    <main className="section-shell py-16">
      <Card className="mx-auto max-w-5xl">
        <CardHeader className="space-y-4 border-b border-black/8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getPickupRequestStatusTone(pickupRequest.status)}>
              {pickupRequestStatusLabels[pickupRequest.status]}
            </Badge>
            <Badge variant={getPickupRequestPaymentTone(pickupRequest.paymentStatus)}>
              {pickupRequestPaymentStatusLabels[pickupRequest.paymentStatus]}
            </Badge>
            <Badge variant={getPickupRequestEmailTone(pickupRequest.emailStatus)}>
              {pickupRequestEmailStatusLabels[pickupRequest.emailStatus]}
            </Badge>
          </div>
          <div className="space-y-2">
            <CardTitle>{pickupRequest.requestNumber}</CardTitle>
            <CardDescription>
              Detalle privado de tu pedido pickup, con estado, pago, email y contexto suficiente
              para saber que sigue sin depender solo del resumen de mi cuenta.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <section className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
              Siguiente paso
            </p>
            <p className="mt-3 text-sm leading-7 text-[#5f6368]">{nextStep}</p>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <section className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-black/8 bg-white text-[#111111]">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                    Pedido
                  </p>
                  <p className="text-lg font-semibold text-[#111111]">
                    {formatCartAmount(pickupRequest.total, pickupRequest.currencyCode)}
                  </p>
                  <p className="text-sm leading-6 text-[#5f6368]">
                    {pickupRequest.itemCount} producto(s) en modalidad recogida local.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-black/8 bg-white text-[#111111]">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                    Ultima actualizacion
                  </p>
                  <p className="text-sm font-semibold text-[#111111]">
                    {formatMemberAccountDate(pickupRequest.updatedAt)}
                  </p>
                  <p className="text-sm leading-6 text-[#5f6368]">
                    Creado {formatMemberAccountDate(pickupRequest.createdAt)}.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-black/8 bg-white text-[#111111]">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                    Email del pedido
                  </p>
                  <p className="text-sm font-semibold text-[#111111]">{pickupRequest.email}</p>
                  <p className="text-sm leading-6 text-[#5f6368]">
                    {pickupRequest.emailSentAt
                      ? `Ultimo envio confirmado ${formatMemberAccountDate(pickupRequest.emailSentAt)}.`
                      : "Aun no hay confirmacion de envio registrada."}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                Timeline
              </p>
              <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                Asi va tu pedido desde que quedo registrado hasta la recogida.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {timeline.map((step) => (
                <article
                  key={step.key}
                  className="rounded-none border border-black/8 bg-[#fbfbf8] p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                    {step.title}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#111111]">{step.description}</p>
                  <p className="mt-2 text-xs leading-5 text-[#6b7280]">
                    {step.date ? formatMemberAccountDate(step.date) : "Sin marca todavia"}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
            <section className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                Lineas del pedido
              </p>
              <div className="mt-4 space-y-3">
                {pickupRequest.lineItems.map((lineItem) => (
                  <article key={lineItem.id} className="border border-black/8 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#111111]">{lineItem.title}</p>
                        {lineItem.selectedOptions.length > 0 ? (
                          <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                            {lineItem.selectedOptions
                              .map((option) =>
                                option.optionTitle
                                  ? `${option.optionTitle}: ${option.value}`
                                  : option.value,
                              )
                              .join(" | ")}
                          </p>
                        ) : null}
                        {lineItem.variantSku ? (
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#7a7f87]">
                            SKU {lineItem.variantSku}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#111111]">
                          {formatCartAmount(lineItem.total, pickupRequest.currencyCode)}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#5f6368]">
                          {lineItem.quantity} x{" "}
                          {formatCartAmount(lineItem.unitPrice, pickupRequest.currencyCode)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                Resumen
              </p>
              <div className="mt-4 space-y-4 text-sm leading-6 text-[#5f6368]">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatCartAmount(pickupRequest.subtotal, pickupRequest.currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-black/8 pt-3 font-semibold text-[#111111]">
                  <span>Total</span>
                  <span>{formatCartAmount(pickupRequest.total, pickupRequest.currencyCode)}</span>
                </div>
                {pickupRequest.chargedCurrencyCode && pickupRequest.chargedTotal !== null ? (
                  <div className="flex items-center justify-between">
                    <span>Cargo PayPal</span>
                    <span>
                      {formatCartAmount(
                        pickupRequest.chargedTotal,
                        pickupRequest.chargedCurrencyCode,
                      )}
                    </span>
                  </div>
                ) : null}
                {pickupRequest.exchangeRate ? (
                  <p>
                    Tipo de cambio aplicado:{" "}
                    <strong className="text-[#111111]">
                      S/ {pickupRequest.exchangeRate.toFixed(3)} por USD
                    </strong>
                    .
                  </p>
                ) : null}
                {pickupRequest.notes ? (
                  <div className="border border-black/8 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                      Nota de recogida
                    </p>
                    <p className="mt-2">{pickupRequest.notes}</p>
                  </div>
                ) : null}
                {pickupRequest.emailError ? (
                  <div className="border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    <p className="font-semibold">Ultimo error de email</p>
                    <p className="mt-2">{pickupRequest.emailError}</p>
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/mi-cuenta#pedidos-pickup">Volver a mi cuenta</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tienda">Seguir comprando</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
