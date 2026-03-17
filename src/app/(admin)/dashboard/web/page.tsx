import AdminSection from "@/components/admin/AdminSection";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import WebSectionForm from "@/components/admin/WebSectionForm";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/site";

export default async function DashboardWebPage() {
  const { settings, warning } = await getDashboardData();
  const { isReadOnly } = await getDashboardCapabilities();
  const disabledReason = isReadOnly
    ? "Configura SUPABASE_SERVICE_ROLE_KEY para guardar cambios reales."
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Diseño Web"
        description="Controla la primera impresión: bienvenida y avisos destacados."
      />
      {warning ? <DashboardNotice message={warning} /> : null}
      {disabledReason ? <DashboardNotice message={disabledReason} /> : null}
      <AdminSection
        title="Secciones visuales"
        description="Edita el texto de bienvenida y las promociones vigentes."
      >
        <WebSectionForm settings={settings} disabledReason={disabledReason} />
      </AdminSection>
    </div>
  );
}
