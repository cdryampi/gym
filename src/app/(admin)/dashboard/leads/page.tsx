import { Inbox, MessageCircleMore, PhoneCall, SearchCheck, Users } from "lucide-react";

import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminSection from "@/components/admin/AdminSection";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import LeadsTable from "@/components/admin/LeadsTable";
import LeadsToolbar from "@/components/admin/LeadsToolbar";
import { countLeadsByStatus } from "@/lib/admin-dashboard";
import { getDashboardCapabilities } from "@/lib/auth";
import {
  DEFAULT_LEAD_FILTERS,
  filterAndSortLeads,
  getAvailableSources,
  parseLeadFilters,
} from "@/lib/data/leads";
import { getDashboardData } from "@/lib/data/site";

export default async function DashboardLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filters = parseLeadFilters(params);

  const { leads, warning } = await getDashboardData();
  const { isReadOnly } = await getDashboardCapabilities();

  const availableSources = getAvailableSources(leads);
  const filteredLeads = filterAndSortLeads(leads, filters);
  const summary = countLeadsByStatus(filteredLeads);
  const hasActiveFilters =
    filters.q !== DEFAULT_LEAD_FILTERS.q ||
    filters.status !== DEFAULT_LEAD_FILTERS.status ||
    filters.source !== DEFAULT_LEAD_FILTERS.source ||
    filters.sort !== DEFAULT_LEAD_FILTERS.sort;

  const disabledReason = isReadOnly
    ? "Configura SUPABASE_SERVICE_ROLE_KEY para leer y actualizar contactos reales."
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Leads"
        description="Contactos recibidos desde la web publica del gimnasio y su seguimiento comercial."
        icon={Users}
        eyebrow="Captacion"
      />
      {warning ? <DashboardNotice message={warning} /> : null}
      {disabledReason ? <DashboardNotice message={disabledReason} /> : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminMetricCard
          label="Nuevos"
          value={String(summary.new)}
          hint="Leads que todavia no salieron del estado inicial."
          icon={Inbox}
          tone={summary.new ? "warning" : "success"}
        />
        <AdminMetricCard
          label="Contactados"
          value={String(summary.contacted)}
          hint="Conversaciones ya iniciadas desde el panel."
          icon={PhoneCall}
          tone="muted"
        />
        <AdminMetricCard
          label="Cerrados"
          value={String(summary.closed)}
          hint="Leads ya convertidos o resueltos."
          icon={MessageCircleMore}
          tone="success"
        />
      </div>

      <AdminSection
        title="Bandeja de leads"
        description="Vista compacta, legible y usable tanto en escritorio como en movil."
        icon={SearchCheck}
      >
        <div className="space-y-4">
          <LeadsToolbar
            key={`${filters.q}|${filters.status}|${filters.source}|${filters.sort}`}
            filters={filters}
            availableSources={availableSources}
          />
          <LeadsTable
            leads={filteredLeads}
            disabledReason={disabledReason}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      </AdminSection>
    </div>
  );
}
