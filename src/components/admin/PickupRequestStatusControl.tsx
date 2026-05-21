"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { updateDashboardPickupRequestStatus } from "@/app/(admin)/dashboard/tienda/actions";
import { Button } from "@/components/ui/button";
import {
  getPickupRequestStatusTone,
  pickupRequestStatusLabels,
} from "@/lib/cart/pickup-request";
import type { PickupRequestStatus } from "@/lib/cart/types";

const pickupRequestStatuses: PickupRequestStatus[] = [
  "requested",
  "confirmed",
  "ready_for_pickup",
  "fulfilled",
  "cancelled",
];

const quickActionMap: Record<
  PickupRequestStatus,
  Array<{ label: string; value: PickupRequestStatus; variant?: "default" | "outline" | "secondary" }>
> = {
  requested: [
    { label: "Confirmar pedido", value: "confirmed" },
    { label: "Cancelar", value: "cancelled", variant: "outline" },
  ],
  confirmed: [
    { label: "Marcar listo para recoger", value: "ready_for_pickup" },
    { label: "Volver a solicitado", value: "requested", variant: "outline" },
    { label: "Cancelar", value: "cancelled", variant: "outline" },
  ],
  ready_for_pickup: [
    { label: "Marcar entregado", value: "fulfilled" },
    { label: "Volver a confirmado", value: "confirmed", variant: "outline" },
  ],
  fulfilled: [{ label: "Reabrir como listo", value: "ready_for_pickup", variant: "outline" }],
  cancelled: [{ label: "Reabrir pedido", value: "requested", variant: "outline" }],
};

interface PickupRequestStatusControlProps {
  pickupRequestId: string;
  status: PickupRequestStatus;
}

export default function PickupRequestStatusControl({
  pickupRequestId,
  status,
}: Readonly<PickupRequestStatusControlProps>) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<PickupRequestStatus>(status);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const quickActions = useMemo(() => quickActionMap[status] ?? [], [status]);
  const displayedStatus = isPending ? selectedStatus : status;

  function applyStatus(nextStatus: PickupRequestStatus) {
    if (nextStatus === status) {
      setFeedback(`El pedido ya está en ${pickupRequestStatusLabels[nextStatus].toLowerCase()}.`);
      return;
    }

    const previousStatus = displayedStatus;
    setSelectedStatus(nextStatus);
    setError(null);
    setFeedback("Guardando estado...");

    startTransition(async () => {
      try {
        await updateDashboardPickupRequestStatus(pickupRequestId, nextStatus);
        setFeedback(`Estado actualizado a ${pickupRequestStatusLabels[nextStatus].toLowerCase()}.`);
        router.refresh();
      } catch (nextError) {
        setSelectedStatus(previousStatus);
        setFeedback(null);
        setError(
          nextError instanceof Error ? nextError.message : "No se pudo actualizar el estado.",
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border border-black/10 bg-black/[0.02] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`inline-flex items-center rounded-none border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${getPickupRequestStatusTone(status) === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : getPickupRequestStatusTone(status) === "warning" ? "border-amber-200 bg-amber-50 text-amber-700" : getPickupRequestStatusTone(status) === "muted" ? "border-black/8 bg-[#f1ece4] text-[#4b5563]" : "border-[#d71920]/15 bg-[#fff0f0] text-[#b91c1c]"}`}
          >
            Estado actual: {pickupRequestStatusLabels[status]}
          </div>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin text-[#7a7f87]" /> : null}
        </div>

        <p className="text-sm text-[#5f6368]">
          Usa una acción rápida para avanzar el pedido o cambia a cualquier otro estado desde el
          selector avanzado.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Button
              key={`${status}-${action.value}`}
              type="button"
              variant={action.variant ?? "default"}
              className="h-11 justify-center rounded-none text-[10px] font-black uppercase tracking-[0.14em]"
              disabled={isPending}
              onClick={() => applyStatus(action.value)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`pickup-request-status-${pickupRequestId}`}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a7f87]"
        >
          Selector avanzado
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <select
              id={`pickup-request-status-${pickupRequestId}`}
              className="h-11 w-full rounded-none border border-black/10 bg-white px-4 text-[13px] font-bold text-[#111111] outline-none transition-colors focus:border-black/20"
              value={displayedStatus}
              disabled={isPending}
              onChange={(event) => applyStatus(event.target.value as PickupRequestStatus)}
            >
              {pickupRequestStatuses.map((pickupStatus) => (
                <option key={pickupStatus} value={pickupStatus}>
                  {pickupRequestStatusLabels[pickupStatus].toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="text-sm text-[#5f6368]" aria-live="polite">
        {feedback ?? "El cambio se guarda al momento. No hace falta pulsar un segundo botón."}
      </p>
      {error ? <p className="text-sm font-medium text-[#b91c1c]">{error}</p> : null}
    </div>
  );
}
