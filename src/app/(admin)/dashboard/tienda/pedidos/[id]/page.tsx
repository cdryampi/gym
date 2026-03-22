import { notFound } from "next/navigation";

import AdminSection from "@/components/admin/AdminSection";
import AdminSurface from "@/components/admin/AdminSurface";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import PickupRequestStatusControl from "@/components/admin/PickupRequestStatusControl";
import ResendPickupRequestEmailButton from "@/components/admin/ResendPickupRequestEmailButton";
import { Badge } from "@/components/ui/badge";
import { formatCartAmount } from "@/lib/cart/format";
import {
  getPickupRequestEmailTone,
  getPickupRequestStatusTone,
  pickupRequestEmailStatusLabels,
  pickupRequestStatusLabels,
} from "@/lib/cart/pickup-request";
import { getPickupRequestById } from "@/lib/data/pickup-requests";

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

export default async function DashboardStorePickupRequestDetailPage({
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
    <div className="space-y-6">
      <DashboardPageHeader
        title={pickupRequest.requestNumber}
        description="Detalle congelado del pedido pickup, con lineas, totales, estado operativo y control del email."
        eyebrow="Pedidos pickup"
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-4">
          <AdminSection title="Lineas" description="Snapshot del cart enviado al cerrar la solicitud.">
            <div className="space-y-3">
              {pickupRequest.lineItems.map((lineItem) => (
                <AdminSurface key={lineItem.id} inset className="p-4">
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
                            .join(" · ")}
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
                </AdminSurface>
              ))}
            </div>
          </AdminSection>
        </div>

        <div className="space-y-4">
          <AdminSection title="Estado" description="Control operativo del pedido pickup.">
            <AdminSurface inset className="space-y-5 p-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant={getPickupRequestStatusTone(pickupRequest.status)}>
                  {pickupRequestStatusLabels[pickupRequest.status]}
                </Badge>
                <Badge variant={getPickupRequestEmailTone(pickupRequest.emailStatus)}>
                  {pickupRequestEmailStatusLabels[pickupRequest.emailStatus]}
                </Badge>
              </div>
              <PickupRequestStatusControl
                pickupRequestId={pickupRequest.id}
                status={pickupRequest.status}
              />
              <ResendPickupRequestEmailButton pickupRequestId={pickupRequest.id} />
            </AdminSurface>
          </AdminSection>

          <AdminSection title="Resumen" description="Totales, notas y trazabilidad del pedido.">
            <AdminSurface inset className="space-y-4 p-5">
              <div className="flex items-center justify-between text-sm text-[#5f6368]">
                <span>Articulos</span>
                <span>{pickupRequest.itemCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-[#5f6368]">
                <span>Subtotal</span>
                <span>{formatCartAmount(pickupRequest.subtotal, pickupRequest.currencyCode)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-black/8 pt-3 text-sm font-semibold text-[#111111]">
                <span>Total</span>
                <span>{formatCartAmount(pickupRequest.total, pickupRequest.currencyCode)}</span>
              </div>

              <div className="border-t border-black/8 pt-4 text-sm leading-6 text-[#5f6368]">
                <p>
                  <strong className="text-[#111111]">Email:</strong> {pickupRequest.email}
                </p>
                <p>
                  <strong className="text-[#111111]">Origen:</strong> {pickupRequest.source}
                </p>
                <p>
                  <strong className="text-[#111111]">Cart:</strong> {pickupRequest.cartId}
                </p>
                <p>
                  <strong className="text-[#111111]">Customer:</strong>{" "}
                  {pickupRequest.customerId ?? "Invitado"}
                </p>
                <p>
                  <strong className="text-[#111111]">Supabase user:</strong>{" "}
                  {pickupRequest.supabaseUserId ?? "No vinculado"}
                </p>
                <p>
                  <strong className="text-[#111111]">Creado:</strong>{" "}
                  {formatDate(pickupRequest.createdAt)}
                </p>
                <p>
                  <strong className="text-[#111111]">Ultima actualizacion:</strong>{" "}
                  {formatDate(pickupRequest.updatedAt)}
                </p>
                <p>
                  <strong className="text-[#111111]">Ultimo email:</strong>{" "}
                  {formatDate(pickupRequest.emailSentAt)}
                </p>
              </div>

              {pickupRequest.notes ? (
                <div className="border border-black/8 bg-white p-4 text-sm leading-6 text-[#5f6368]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                    Nota de recogida
                  </p>
                  <p className="mt-2">{pickupRequest.notes}</p>
                </div>
              ) : null}

              {pickupRequest.emailError ? (
                <div className="border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  <p className="font-semibold">Ultimo error de email</p>
                  <p className="mt-2">{pickupRequest.emailError}</p>
                </div>
              ) : null}
            </AdminSurface>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
