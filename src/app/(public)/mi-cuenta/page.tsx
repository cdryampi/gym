import { Clock3, ShieldCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";

import AuthFeedbackDialog from "@/components/auth/AuthFeedbackDialog";
import MemberSignOutButton from "@/components/auth/MemberSignOutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireMemberUser } from "@/lib/auth";
import { formatCartAmount } from "@/lib/cart/format";
import {
  getPickupRequestPaymentTone,
  getPickupRequestStatusTone,
  pickupRequestPaymentStatusLabels,
  pickupRequestStatusLabels,
} from "@/lib/cart/pickup-request";
import { getCurrentCartSnapshot } from "@/lib/cart/server";
import { getMemberPickupRequestsHistory } from "@/lib/data/pickup-requests";
import {
  formatMemberAccountDate,
  getMemberAccountQuickLinks,
  getMemberAuthProviderLabel,
} from "@/lib/member-account";

export const dynamic = "force-dynamic";

export default async function MemberAccountPage() {
  const user = await requireMemberUser("/acceso?next=/mi-cuenta");
  const activeCart = await getCurrentCartSnapshot();
  const pickupHistory = await getMemberPickupRequestsHistory({
    email: user.email,
    supabaseUserId: user.id,
  });
  const latestPickupRequest = pickupHistory.pickupRequests[0] ?? null;
  const previousPickupRequests = pickupHistory.pickupRequests.slice(1);
  const quickLinks = getMemberAccountQuickLinks({
    hasActiveCart: Boolean(activeCart && activeCart.items.length > 0),
    hasPickupHistory: pickupHistory.pickupRequests.length > 0,
  });
  const authProviderLabel = getMemberAuthProviderLabel(user);

  return (
    <main className="section-shell py-16">
      <AuthFeedbackDialog variant="welcome" />
      <Card className="mx-auto max-w-5xl">
        <CardHeader className="space-y-4 border-b border-black/8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">Acceso activo</Badge>
            <Badge variant="muted">{authProviderLabel}</Badge>
          </div>
          <div className="space-y-2">
            <CardTitle>Mi cuenta</CardTitle>
            <CardDescription>
              Tu superficie privada para revisar tu acceso, retomar tu carrito y seguir tus
              pedidos pickup sin convertir esto todavia en un modulo de miembros complejo.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-none border border-black/8 bg-[#fbfbf8] p-5" id="cuenta">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                Cuenta basica
              </p>
              <p className="mt-2 text-lg font-semibold text-[#111111]">{user.email}</p>
              <dl className="mt-4 space-y-3 text-sm leading-6 text-[#5f6368]">
                <div>
                  <dt className="font-semibold text-[#111111]">Metodo de acceso</dt>
                  <dd>{authProviderLabel}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#111111]">Alta de cuenta</dt>
                  <dd>{formatMemberAccountDate(user.created_at)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#111111]">Ultimo acceso</dt>
                  <dd>{formatMemberAccountDate(user.last_sign_in_at)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-[#d71920]/10 bg-[#fff5f5] text-[#d71920]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                    Sesion y seguridad
                  </p>
                  <p className="text-sm leading-6 text-[#5f6368]">
                    Tu acceso esta operativo. Desde aqui solo exponemos datos visibles y acciones
                    basicas de cuenta, sin mezclarlo con gestion avanzada de miembros.
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-black/8 pt-4">
                <MemberSignOutButton />
              </div>
            </section>

            <section className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                Accesos utiles
              </p>
              <div className="mt-4 space-y-3">
                {quickLinks.map((link) => (
                  <div key={link.href} className="border border-black/8 bg-white p-4">
                    <p className="text-sm font-semibold text-[#111111]">{link.label}</p>
                    <p className="mt-2 text-sm leading-6 text-[#5f6368]">{link.description}</p>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-3 tracking-normal"
                    >
                      <Link href={link.href}>Abrir</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-none border border-black/8 bg-[#fbfbf8] p-5" id="commerce">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-black/8 bg-white text-[#111111]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                  Commerce
                </p>
                {activeCart && activeCart.items.length > 0 ? (
                  <>
                    <p className="text-lg font-semibold text-[#111111]">
                      Carrito activo con {activeCart.summary.itemCount} producto(s)
                    </p>
                    <p className="text-sm leading-6 text-[#5f6368]">
                      Total estimado:{" "}
                      {formatCartAmount(activeCart.summary.total, activeCart.summary.currencyCode)}
                      . Puedes retomarlo desde el carrito y continuar el pago cuando quieras.
                    </p>
                  </>
                ) : (
                  <p className="text-sm leading-6 text-[#5f6368]">
                    Todavia no tienes un carrito activo. Cuando empieces una compra en la tienda,
                    aqui veras su estado y podras retomarla.
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="space-y-6" id="pedidos-pickup">
            <section className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-black/8 bg-white text-[#111111]">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                    Ultimo pedido pickup
                  </p>
                  {latestPickupRequest ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-[#111111]">
                          {latestPickupRequest.requestNumber}
                        </p>
                        <Badge variant={getPickupRequestStatusTone(latestPickupRequest.status)}>
                          {pickupRequestStatusLabels[latestPickupRequest.status]}
                        </Badge>
                        <Badge
                          variant={getPickupRequestPaymentTone(
                            latestPickupRequest.paymentStatus,
                          )}
                        >
                          {pickupRequestPaymentStatusLabels[latestPickupRequest.paymentStatus]}
                        </Badge>
                      </div>
                      <p className="text-sm leading-6 text-[#5f6368]">
                        Total del pedido:{" "}
                        {formatCartAmount(
                          latestPickupRequest.total,
                          latestPickupRequest.currencyCode,
                        )}
                        {latestPickupRequest.chargedCurrencyCode &&
                        latestPickupRequest.chargedTotal !== null
                          ? ` · Cargo PayPal: ${formatCartAmount(
                              latestPickupRequest.chargedTotal,
                              latestPickupRequest.chargedCurrencyCode,
                            )}`
                          : ""}
                        .
                      </p>
                      <p className="text-sm leading-6 text-[#5f6368]">
                        Estado del email:{" "}
                        <strong className="text-[#111111]">
                          {latestPickupRequest.emailStatus}
                        </strong>
                        .
                        {latestPickupRequest.emailError
                          ? ` Ultimo error: ${latestPickupRequest.emailError}`
                          : " El resumen del pedido ya se ha procesado correctamente."}
                      </p>
                      <p className="text-sm leading-6 text-[#5f6368]">
                        Pedido Medusa:{" "}
                        <strong className="text-[#111111]">
                          {latestPickupRequest.orderId ?? "pendiente"}
                        </strong>
                        . Ultima actualizacion:{" "}
                        <strong className="text-[#111111]">
                          {formatMemberAccountDate(latestPickupRequest.updatedAt)}
                        </strong>
                        .
                      </p>
                      <Button asChild variant="outline" size="sm" className="mt-2 tracking-normal">
                        <Link href={`/mi-cuenta/pedidos/${latestPickupRequest.id}`}>
                          Abrir detalle
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm leading-6 text-[#5f6368]">
                      Cuando completes tu primer pedido pickup desde la tienda, aqui veras su
                      referencia, estado y trazabilidad basica.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                Historial de pedidos
              </p>
              {pickupHistory.warning ? (
                <p className="mt-2 text-sm leading-6 text-amber-700">{pickupHistory.warning}</p>
              ) : previousPickupRequests.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {previousPickupRequests.map((pickupRequest) => (
                    <div
                      key={pickupRequest.id}
                      className="flex flex-col gap-2 border border-black/8 bg-white p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#111111]">
                          {pickupRequest.requestNumber}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#5f6368]">
                          {formatCartAmount(pickupRequest.total, pickupRequest.currencyCode)} ·{" "}
                          {formatMemberAccountDate(pickupRequest.updatedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={getPickupRequestStatusTone(pickupRequest.status)}>
                          {pickupRequestStatusLabels[pickupRequest.status]}
                        </Badge>
                        <Badge variant={getPickupRequestPaymentTone(pickupRequest.paymentStatus)}>
                          {pickupRequestPaymentStatusLabels[pickupRequest.paymentStatus]}
                        </Badge>
                        <Button asChild variant="outline" size="sm" className="tracking-normal">
                          <Link href={`/mi-cuenta/pedidos/${pickupRequest.id}`}>Ver detalle</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                  Todavia no tienes mas pedidos pickup asociados a esta cuenta.
                </p>
              )}
            </section>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
