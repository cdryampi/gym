import { Settings2, ShieldCheck } from "lucide-react";

import AdminSection from "@/components/admin/AdminSection";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import SettingsForm from "@/components/admin/SettingsForm";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/site";

export default async function DashboardSettingsPage() {
  const { settings, warning } = await getDashboardData();
  const { isReadOnly } = await getDashboardCapabilities();
  const disabledReason = isReadOnly
    ? "Configura SUPABASE_SERVICE_ROLE_KEY para guardar cambios reales."
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Ajustes Internos"
        description="Configuracion avanzada del sitio: identidad, buscadores y pie de pagina."
        icon={Settings2}
        eyebrow="Sistema"
      />
      {warning ? <DashboardNotice message={warning} /> : null}
      {disabledReason ? <DashboardNotice message={disabledReason} /> : null}
      <AdminSection
        title="Configuracion global"
        description="Una sola ruta para editar la capa publica sin perder contexto."
        icon={ShieldCheck}
      >
        <SettingsForm settings={settings} disabledReason={disabledReason} />
      </AdminSection>
    </div>
  );
}
