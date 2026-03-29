import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { countLeadsByStatus } from "@/lib/admin-dashboard";
import type { Lead } from "@/lib/supabase/database.types";
import { formatShortDate } from "@/lib/utils";

import AdminSurface from "./AdminSurface";
import DashboardEmptyState from "./DashboardEmptyState";
import LeadDetailsDialogTrigger from "./LeadDetailsDialogTrigger";
import LeadStatusBadge from "./LeadStatusBadge";
import LeadStatusSelect from "./LeadStatusSelect";

interface LeadsTableProps {
  leads: Lead[];
  disabledReason?: string;
  hasActiveFilters?: boolean;
}

export default function LeadsTable({
  leads,
  disabledReason,
  hasActiveFilters = false,
}: LeadsTableProps) {
  if (!leads.length) {
    return (
      <DashboardEmptyState
        title={hasActiveFilters ? "No hay resultados para estos filtros" : "Todavia no hay leads"}
        description={
          hasActiveFilters
            ? "Prueba con otra busqueda o limpia los filtros para volver a ver toda la bandeja."
            : "Cuando alguien complete el formulario publico, aparecera aqui con su estado y fecha de entrada."
        }
        actionHref={hasActiveFilters ? undefined : "/#contacto"}
        actionLabel={hasActiveFilters ? undefined : "Probar formulario publico"}
      />
    );
  }

  const leadSummary = countLeadsByStatus(leads);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminSurface inset className="px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
            Nuevos
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#111111]">{leadSummary.new}</p>
        </AdminSurface>
        <AdminSurface inset className="px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
            Contactados
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#111111]">{leadSummary.contacted}</p>
        </AdminSurface>
        <AdminSurface inset className="px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
            Cerrados
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#111111]">{leadSummary.closed}</p>
        </AdminSurface>
      </div>

      <div className="space-y-3 md:hidden">
        {leads.map((lead) => (
          <AdminSurface key={lead.id} inset className="p-4">
            <div>
              <p className="font-semibold text-[#111111]">{lead.name}</p>
              <p className="mt-1 text-sm text-[#5f6368]">{lead.email}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <LeadStatusBadge status={lead.status} />
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#7a7f87]">
                <span className="inline-flex items-center rounded-none border border-black/8 bg-[#f3f4f6] px-2 py-0.5">
                  {lead.source}
                </span>
                <span className="text-[#9ea4ad]">
                  {formatShortDate(lead.created_at)}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#5f6368]">{lead.message}</p>
            <p className="mt-3 text-sm text-[#5f6368]">Telefono: {lead.phone || "Sin telefono"}</p>
            <div className="mt-4 space-y-4">
              <LeadStatusSelect
                leadId={lead.id}
                currentStatus={lead.status}
                disabledReason={disabledReason}
              />
              <LeadDetailsDialogTrigger lead={lead} disabledReason={disabledReason} />
            </div>
          </AdminSurface>
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Mensaje</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <p className="font-medium text-[#111111]">{lead.name}</p>
                  <p className="mt-1 text-sm text-[#5f6368]">{lead.email}</p>
                </TableCell>
                <TableCell className="max-w-xl">
                  <p className="truncate text-sm text-[#5f6368]" title={lead.message}>
                    {lead.message}
                  </p>
                </TableCell>
                <TableCell>{lead.phone || "Sin telefono"}</TableCell>
                <TableCell>
                  <LeadStatusSelect
                    leadId={lead.id}
                    currentStatus={lead.status}
                    disabledReason={disabledReason}
                  />
                </TableCell>
                <TableCell className="uppercase text-[#5f6368]">{lead.source}</TableCell>
                <TableCell>{formatShortDate(lead.created_at)}</TableCell>
                <TableCell className="text-right">
                  <LeadDetailsDialogTrigger lead={lead} disabledReason={disabledReason} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
