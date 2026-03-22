"use client";

import { useTransition } from "react";

import { resendDashboardPickupRequestEmail } from "@/app/(admin)/dashboard/tienda/actions";

interface ResendPickupRequestEmailButtonProps {
  pickupRequestId: string;
}

export default function ResendPickupRequestEmailButton({
  pickupRequestId,
}: Readonly<ResendPickupRequestEmailButtonProps>) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className="inline-flex h-12 items-center justify-center border border-black/12 bg-white px-5 text-sm font-semibold text-[#111111] transition hover:border-[#d71920] hover:text-[#d71920] disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() => {
        startTransition(async () => {
          try {
            await resendDashboardPickupRequestEmail(pickupRequestId);
            alert("Email reenviado correctamente.");
          } catch (error) {
            alert(error instanceof Error ? error.message : "No se pudo reenviar el email.");
          }
        });
      }}
    >
      {isPending ? "Reenviando..." : "Reenviar email"}
    </button>
  );
}
