"use client";

import { useTransition } from "react";
import { syncPickupRequestFromMedusaOrderAction } from "@/app/(admin)/dashboard/tienda/actions";

interface SyncPickupRequestFromOrderButtonProps {
  pickupRequestId: string;
  cartId: string;
  orderId: string | null;
}

export default function SyncPickupRequestFromOrderButton({
  pickupRequestId,
  cartId,
  orderId,
}: Readonly<SyncPickupRequestFromOrderButtonProps>) {
  const [isPending, startTransition] = useTransition();

  if (!orderId) {
    return null;
  }

  return (
    <button
      type="button"
      disabled={isPending}
      className="inline-flex h-12 items-center justify-center border border-black/12 bg-white px-5 text-sm font-semibold text-[#111111] transition hover:border-[#111111] hover:bg-black/4 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() => {
        if (!confirm("¿Deseas sincronizar este pedido de Medusa con la solicitud pickup local? Esto sobrescribirá los datos del snapshot si ya existen.")) {
          return;
        }

        startTransition(async () => {
          try {
            await syncPickupRequestFromMedusaOrderAction(pickupRequestId, cartId, orderId);
            alert("Sincronización completada correctamente. Los datos del pedido se han actualizado.");
          } catch (error) {
            alert(error instanceof Error ? error.message : "No se pudo sincronizar el pedido.");
          }
        });
      }}
    >
      {isPending ? "Sincronizando..." : "Sincronizar con Medusa"}
    </button>
  );
}
