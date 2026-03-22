"use client";

import { useState, useTransition } from "react";

import { updateDashboardPickupRequestStatus } from "@/app/(admin)/dashboard/tienda/actions";
import {
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

interface PickupRequestStatusControlProps {
  pickupRequestId: string;
  status: PickupRequestStatus;
}

export default function PickupRequestStatusControl({
  pickupRequestId,
  status,
}: Readonly<PickupRequestStatusControlProps>) {
  const [selectedStatus, setSelectedStatus] = useState<PickupRequestStatus>(status);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <select
        className="h-12 min-w-[220px] border border-black/12 bg-white px-4 text-sm text-[#111111]"
        value={selectedStatus}
        disabled={isPending}
        onChange={(event) => setSelectedStatus(event.target.value as PickupRequestStatus)}
      >
        {pickupRequestStatuses.map((pickupStatus) => (
          <option key={pickupStatus} value={pickupStatus}>
            {pickupRequestStatusLabels[pickupStatus]}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={isPending || selectedStatus === status}
        className="inline-flex h-12 items-center justify-center border border-black/12 bg-white px-5 text-sm font-semibold text-[#111111] transition hover:border-[#111111] hover:bg-[#111111] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => {
          startTransition(async () => {
            try {
              await updateDashboardPickupRequestStatus(pickupRequestId, selectedStatus);
            } catch (error) {
              alert(error instanceof Error ? error.message : "No se pudo actualizar el estado.");
            }
          });
        }}
      >
        {isPending ? "Guardando..." : "Guardar estado"}
      </button>
    </div>
  );
}
