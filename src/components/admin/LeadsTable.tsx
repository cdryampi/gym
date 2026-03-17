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
import LeadStatusBadge from "./LeadStatusBadge";
import LeadStatusSelect from "./LeadStatusSelect";

interface LeadsTableProps {
  leads: Lead[];
  disabledReason?: string;
}

export default function LeadsTable({ leads, disabledReason }: LeadsTableProps) {
  if (!leads.length) {
    return (
      <DashboardEmptyState
        title="Todavia no hay leads"
        description="Cuando alguien complete el formulario publico, aparecera aqui con su estado y fecha de entrada."
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-[#111111]">{lead.name}</p>
                <p className="mt-1 text-sm text-[#5f6368]">{lead.email}</p>
              </div>
              <LeadStatusBadge status={lead.status} />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#5f6368]">{lead.message}</p>
            <div className="mt-4 grid gap-2 text-sm text-[#5f6368]">
              <p>Telefono: {lead.phone || "Sin telefono"}</p>
              <p>Origen: {lead.source.toUpperCase()}</p>
              <p>Fecha: {formatShortDate(lead.created_at)}</p>
            </div>
            <div className="mt-4">
              <LeadStatusSelect
                leadId={lead.id}
                currentStatus={lead.status}
                disabledReason={disabledReason}
              />
            </div>
          </AdminSurface>
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-[#111111]">{lead.name}</p>
                    <p className="mt-1 max-w-xl truncate text-sm text-[#5f6368]" title={lead.message}>
                      {lead.message}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{lead.email}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
