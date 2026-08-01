import { Dumbbell } from "lucide-react";

import AdminSection from "@/components/admin/AdminSection";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import TrainingZonesForm from "@/components/admin/TrainingZonesForm";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardMarketingData } from "@/lib/data/site";

export default async function DashboardMarketingZonasPage() {
  const { settings, trainingZones, warning } = await getDashboardMarketingData();
  const { isReadOnly } = await getDashboardCapabilities();
  const disabledReason = isReadOnly
    ? "Configura SUPABASE_SECRET_KEY para guardar cambios reales."
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Zonas de entrenamiento"
        description={`Gestiona videos, textos y estado visible de las zonas comerciales de ${settings.site_name}.`}
        icon={Dumbbell}
        eyebrow="Marketing · Zonas"
      />
      {warning ? <DashboardNotice message={warning} /> : null}
      {disabledReason ? <DashboardNotice message={disabledReason} /> : null}
      <AdminSection
        title="Contenido visible en portada"
        description="Edita cada zona, sube videos pesados a Supabase Storage y guarda para actualizar el carousel publico."
        icon={Dumbbell}
      >
        <TrainingZonesForm zones={trainingZones} disabledReason={disabledReason} />
      </AdminSection>
    </div>
  );
}
