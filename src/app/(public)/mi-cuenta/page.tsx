import AuthFeedbackDialog from "@/components/auth/AuthFeedbackDialog";
import MemberSignOutButton from "@/components/auth/MemberSignOutButton";
import SiteFooter from "@/components/marketing/SiteFooter";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteTopbar from "@/components/marketing/SiteTopbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireMemberUser } from "@/lib/auth";
import { formatCartAmount } from "@/lib/cart/format";
import {
  getPickupRequestPaymentTone,
  pickupRequestPaymentStatusLabels,
} from "@/lib/cart/pickup-request";
import { getCurrentCartSnapshot } from "@/lib/cart/server";
import { getLatestPickupRequestByEmail } from "@/lib/data/pickup-requests";
import { getMarketingData } from "@/lib/data/site";

export const dynamic = "force-dynamic";

export default async function MemberAccountPage() {
  const user = await requireMemberUser("/acceso?next=/mi-cuenta");
  const { settings } = await getMarketingData();
  const activeCart = await getCurrentCartSnapshot();
  const latestPickupRequest = user.email ? await getLatestPickupRequestByEmail(user.email) : null;

  return (
    <div className="min-h-screen bg-[#151518]">
      <div className="sticky top-0 z-50">
        <SiteTopbar settings={settings} />
        <SiteHeader settings={settings} currentUser={user} />
      </div>
      <main className="section-shell py-16">
        <AuthFeedbackDialog variant="welcome" />
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Mi cuenta</CardTitle>
            <CardDescription>
              Tu acceso ya esta creado. Esta zona ira creciendo cuando activemos funciones privadas
              del gimnasio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                Cuenta activa
              </p>
              <p className="mt-2 text-lg font-semibold text-[#111111]">{user.email}</p>
              <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                Estado actual: acceso basico creado. Proximamente podras revisar informacion privada
                del gimnasio desde aqui.
              </p>
            </div>

            <div className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                Commerce
              </p>
              {activeCart && activeCart.items.length > 0 ? (
                <>
                  <p className="mt-2 text-lg font-semibold text-[#111111]">
                    Carrito activo con {activeCart.summary.itemCount} producto(s)
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                    Total estimado:{" "}
                    {formatCartAmount(activeCart.summary.total, activeCart.summary.currencyCode)}.
                    Puedes retomarlo desde la tienda y continuar el pago cuando quieras.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                  Todavia no tienes un carrito activo. Cuando empieces una reserva en la tienda,
                  aqui veras su estado.
                </p>
              )}
            </div>

            <div className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                Ultimo pedido pickup
              </p>
              {latestPickupRequest ? (
                <>
                  <p className="mt-2 text-lg font-semibold text-[#111111]">
                    {latestPickupRequest.requestNumber}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                    Estado actual: <strong>{latestPickupRequest.status}</strong>. Total del pedido:{" "}
                    {formatCartAmount(
                      latestPickupRequest.total,
                      latestPickupRequest.currencyCode,
                    )}
                    {latestPickupRequest.chargedCurrencyCode &&
                    latestPickupRequest.chargedTotal !== null
                      ? ` | Cargo PayPal: ${formatCartAmount(
                          latestPickupRequest.chargedTotal,
                          latestPickupRequest.chargedCurrencyCode,
                        )}`
                      : ""}
                    . Email: {latestPickupRequest.email}.
                  </p>
                  {latestPickupRequest.exchangeRate ? (
                    <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                      Tipo de cambio aplicado: S/ {latestPickupRequest.exchangeRate.toFixed(3)} por USD.
                      {latestPickupRequest.exchangeRateReference
                        ? ` Referencia: ${latestPickupRequest.exchangeRateReference}.`
                        : ""}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <Badge variant={getPickupRequestPaymentTone(latestPickupRequest.paymentStatus)}>
                      {pickupRequestPaymentStatusLabels[latestPickupRequest.paymentStatus]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                    Pedido Medusa: <strong>{latestPickupRequest.orderId ?? "pendiente"}</strong>.
                    {" "}Proveedor: <strong>{latestPickupRequest.paymentProvider ?? "paypal"}</strong>.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                    Estado del correo: <strong>{latestPickupRequest.emailStatus}</strong>.
                    {latestPickupRequest.emailError
                      ? ` Ultimo error registrado: ${latestPickupRequest.emailError}`
                      : " El resumen del pedido ya se ha procesado correctamente."}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                  Cuando completes tu primer pedido pickup desde la tienda, aqui veras su
                  referencia, pago y estado operativo.
                </p>
              )}
            </div>

            <MemberSignOutButton />
          </CardContent>
        </Card>
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
