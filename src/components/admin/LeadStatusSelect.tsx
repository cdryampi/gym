"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { updateLeadStatus } from "@/app/(admin)/dashboard/actions";
import type { LeadStatus } from "@/lib/supabase/database.types";

import LeadStatusBadge from "./LeadStatusBadge";

interface LeadStatusSelectProps {
  leadId: string;
  currentStatus: LeadStatus;
  disabledReason?: string;
}

const items: Array<{ label: string; value: LeadStatus }> = [
  { label: "Nuevo", value: "new" },
  { label: "Contactado", value: "contacted" },
  { label: "Cerrado", value: "closed" },
];

export default function LeadStatusSelect({
  leadId,
  currentStatus,
  disabledReason,
}: LeadStatusSelectProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(status: LeadStatus) {
    startTransition(async () => {
      try {
        setError(null);
        await updateLeadStatus(leadId, status);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "No se pudo actualizar el estado.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <label className="sr-only" htmlFor={`lead-status-${leadId}`}>
        Estado del lead
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          id={`lead-status-${leadId}`}
          defaultValue={currentStatus}
          onChange={(event) => handleChange(event.target.value as LeadStatus)}
          disabled={isPending || Boolean(disabledReason)}
          title={disabledReason ?? undefined}
          className="h-11 rounded-2xl border border-black/10 bg-white px-3 text-sm text-[#111111] outline-none transition-colors focus:border-[#d71920]/30 focus-visible:ring-2 focus-visible:ring-[#d71920]/20 disabled:opacity-60"
        >
          {items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin text-[#7a7f87]" /> : null}
        {!isPending ? <LeadStatusBadge status={currentStatus} /> : null}
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
