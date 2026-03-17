import AdminSection from "@/components/admin/AdminSection";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import GymInfoForm from "@/components/admin/GymInfoForm";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/site";

export default async function DashboardInfoPage() {
  const { settings, warning } = await getDashboardData();
  const { isReadOnly } = await getDashboardCapabilities();
  const disabledReason = isReadOnly
    ? "Configura SUPABASE_SERVICE_ROLE_KEY para guardar cambios reales."
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Datos del Gym"
        description="Información básica, contacto, ubicación y horarios."
      />
      {warning ? <DashboardNotice message={warning} /> : null}
      {disabledReason ? <DashboardNotice message={disabledReason} /> : null}
      <AdminSection
        title="Información operativa"
        description="Gestiona cómo te contactan y dónde te encuentran."
      >
        <GymInfoForm settings={settings} disabledReason={disabledReason} />
      </AdminSection>
    </div>
  );
}
