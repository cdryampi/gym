import { Users } from "lucide-react";

import AdminSection from "@/components/admin/AdminSection";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import MarketingTeamMembersForm from "@/components/admin/MarketingTeamMembersForm";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardMarketingData } from "@/lib/data/site";

export default async function DashboardInfoEntrenadoresPage() {
  const { settings, teamMembers, warning } = await getDashboardMarketingData();
  const { isReadOnly } = await getDashboardCapabilities();
  const disabledReason = isReadOnly
    ? "Configura SUPABASE_SECRET_KEY para guardar cambios reales."
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Entrenadores"
        description={`Gestiona los perfiles del equipo de ${settings.site_name} visibles en la portada.`}
        icon={Users}
        eyebrow="Datos del Gym · Entrenadores"
      />
      {warning ? <DashboardNotice message={warning} /> : null}
      {disabledReason ? <DashboardNotice message={disabledReason} /> : null}
      <AdminSection
        title="Equipo de entrenadores"
        description="Gestiona el bloque Nuestros Expertos visible en la portada."
        icon={Users}
      >
        <MarketingTeamMembersForm teamMembers={teamMembers} disabledReason={disabledReason} />
      </AdminSection>
    </div>
  );
}
