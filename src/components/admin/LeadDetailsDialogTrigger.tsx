"use client";

import { Mail, MessageSquareText, Phone, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getLeadMetadataEntries } from "@/lib/data/leads";
import type { Lead } from "@/lib/supabase/database.types";
import { formatShortDate } from "@/lib/utils";

import LeadFollowUpForm from "./LeadFollowUpForm";
import LeadStatusBadge from "./LeadStatusBadge";
import LeadStatusSelect from "./LeadStatusSelect";

interface LeadDetailsDialogTriggerProps {
  lead: Lead;
  disabledReason?: string;
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-none border border-black/8 bg-[#fbfbf8] p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <p className="mt-3 text-sm text-[#111111]">{value}</p>
    </div>
  );
}

export default function LeadDetailsDialogTrigger({
  lead,
  disabledReason,
}: LeadDetailsDialogTriggerProps) {
  const metadataEntries = getLeadMetadataEntries(lead.metadata);
  const phone = lead.phone || "Sin telefono";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="tracking-normal">
          Ver detalle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,920px)] max-w-3xl overflow-y-auto rounded-none p-0">
        <div className="border-b border-black/8 bg-[#fbfbf8] px-6 py-5">
          <DialogHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <DialogTitle>{lead.name}</DialogTitle>
              <LeadStatusBadge status={lead.status} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                {lead.source}
              </span>
            </div>
            <DialogDescription>
              Lead recibido el {formatShortDate(lead.created_at)}. Revisa el contexto completo y
              actualiza su estado sin salir del dashboard.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem icon={Mail} label="Email" value={lead.email} />
            <DetailItem icon={Phone} label="Telefono" value={phone} />
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
              <MessageSquareText className="h-4 w-4" />
              <span>Mensaje completo</span>
            </div>
            <div className="rounded-none border border-black/8 bg-white p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-[#111111]">{lead.message}</p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                <Tag className="h-4 w-4" />
                <span>Contexto capturado</span>
              </div>
              <div className="rounded-none border border-black/8 bg-[#fbfbf8] p-5">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                      Origen
                    </dt>
                    <dd className="mt-2 text-sm text-[#111111]">{lead.source}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                      Fecha
                    </dt>
                    <dd className="mt-2 text-sm text-[#111111]">{formatShortDate(lead.created_at)}</dd>
                  </div>
                  {metadataEntries.map((entry) => (
                    <div key={entry.key}>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                        {entry.label}
                      </dt>
                      <dd className="mt-2 text-sm text-[#111111]">{entry.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                Operacion comercial
              </p>
              <div className="space-y-4">
                <div className="rounded-none border border-black/8 bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                    Estado del lead
                  </p>
                  <div className="mt-4">
                    <LeadStatusSelect
                      leadId={lead.id}
                      currentStatus={lead.status}
                      disabledReason={disabledReason}
                    />
                  </div>
                </div>
                <div className="rounded-none border border-black/8 bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                    Seguimiento minimo
                  </p>
                  <div className="mt-4">
                    <LeadFollowUpForm lead={lead} disabledReason={disabledReason} />
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
