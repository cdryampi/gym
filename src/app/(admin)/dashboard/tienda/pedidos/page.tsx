import Link from "next/link";

import AdminSection from "@/components/admin/AdminSection";
import AdminSurface from "@/components/admin/AdminSurface";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import { formatCartAmount } from "@/lib/cart/format";
import {
  getPickupRequestEmailTone,
  getPickupRequestPaymentTone,
  getPickupRequestStatusTone,
  pickupRequestEmailStatusLabels,
  pickupRequestPaymentStatusLabels,
  pickupRequestStatusLabels,
} from "@/lib/cart/pickup-request";
import { getPickupRequestsSnapshot } from "@/lib/data/pickup-requests";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function DashboardStorePickupRequestsPage() {
  const snapshot = await getPickupRequestsSnapshot();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Pedidos pickup"
        description="Solicitudes enviadas desde la tienda para recogida local, con control de estado, pago y seguimiento del email."
      />

      {snapshot.warning ? <DashboardNotice message={snapshot.warning} /> : null}

      <AdminSection
        title="Solicitudes enviadas"
        description="Solo mostramos pedidos pickup ya enviados. Los carts activos siguen viviendo en storefront y no aparecen en este tablero."
      >
        {snapshot.pickupRequests.length === 0 ? (
          <AdminSurface inset className="p-5">
            <p className="text-sm font-semibold text-[#111111]">
              Todavia no hay pedidos pickup enviados.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#5f6368]">
              Cuando alguien cierre el carrito desde la tienda, veras aqui su referencia, estado,
              pago y entrega del email.
            </p>
          </AdminSurface>
        ) : (
          <div className="space-y-3">
            {snapshot.pickupRequests.map((pickupRequest) => (
              <AdminSurface
                key={pickupRequest.id}
                inset
                className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.2fr)_150px_220px_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#111111]">
                      {pickupRequest.requestNumber}
                    </p>
                    <Badge variant={getPickupRequestStatusTone(pickupRequest.status)}>
                      {pickupRequestStatusLabels[pickupRequest.status]}
                    </Badge>
                    <Badge variant={getPickupRequestEmailTone(pickupRequest.emailStatus)}>
                      {pickupRequestEmailStatusLabels[pickupRequest.emailStatus]}
                    </Badge>
                    <Badge variant={getPickupRequestPaymentTone(pickupRequest.paymentStatus)}>
                      {pickupRequestPaymentStatusLabels[pickupRequest.paymentStatus]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#7a7f87]">
                    {formatDate(pickupRequest.createdAt)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#5f6368]">{pickupRequest.email}</p>
                  <p className="mt-1 text-sm leading-6 text-[#5f6368]">
                    {pickupRequest.customerId ? "Socio vinculado" : "Invitado"} |{" "}
                    {pickupRequest.itemCount} articulo(s)
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#5f6368]">
                    Order: {pickupRequest.orderId ?? "Pendiente"} | Proveedor:{" "}
                    {pickupRequest.paymentProvider ?? "paypal"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                    Pedido / cobro
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#111111]">
                    {formatCartAmount(pickupRequest.total, pickupRequest.currencyCode)}
                  </p>
                  {pickupRequest.chargedCurrencyCode && pickupRequest.chargedTotal !== null ? (
                    <p className="mt-1 text-sm leading-6 text-[#5f6368]">
                      PayPal:{" "}
                      {formatCartAmount(
                        pickupRequest.chargedTotal,
                        pickupRequest.chargedCurrencyCode,
                      )}
                    </p>
                  ) : null}
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                    Pago y email
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                    {pickupRequest.paymentCapturedAt
                      ? `Cobrado: ${formatDate(pickupRequest.paymentCapturedAt)}. `
                      : ""}
                    {pickupRequest.emailStatus === "failed" && pickupRequest.emailError
                      ? pickupRequest.emailError
                      : pickupRequest.emailSentAt
                        ? `Ultimo envio: ${formatDate(pickupRequest.emailSentAt)}`
                        : "Pendiente de registro"}
                  </p>
                </div>

                <div className="flex items-start justify-end">
                  <Link
                    href={`/dashboard/tienda/pedidos/${pickupRequest.id}`}
                    className="rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-[#111111] transition hover:border-[#111111] hover:bg-[#111111] hover:text-white"
                  >
                    Ver detalle
                  </Link>
                </div>
              </AdminSurface>
            ))}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
