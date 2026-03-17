import { Inbox, MessageCircleMore, PhoneCall } from "lucide-react";

import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminSection from "@/components/admin/AdminSection";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import LeadsTable from "@/components/admin/LeadsTable";
import { countLeadsByStatus } from "@/lib/admin-dashboard";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/site";

export default async function DashboardLeadsPage() {
  const { leads, warning } = await getDashboardData();
  const { isReadOnly } = await getDashboardCapabilities();
  const summary = countLeadsByStatus(leads);
  const disabledReason = isReadOnly
    ? "Configura SUPABASE_SERVICE_ROLE_KEY para leer y actualizar contactos reales."
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Leads"
        description="Contactos recibidos desde la web publica del gimnasio y su seguimiento comercial."
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
      >
        <LeadsTable leads={leads} disabledReason={disabledReason} />
      </AdminSection>
    </div>
  );
}
