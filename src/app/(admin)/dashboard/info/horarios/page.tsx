import { CalendarClock } from "lucide-react";

import AdminSection from "@/components/admin/AdminSection";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import MarketingScheduleForm from "@/components/admin/MarketingScheduleForm";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardMarketingData } from "@/lib/data/site";

export default async function DashboardMarketingHorariosPage() {
  const { settings, scheduleRows, warning } = await getDashboardMarketingData();
  const { isReadOnly } = await getDashboardCapabilities();
  const disabledReason = isReadOnly
    ? "Configura SUPABASE_SECRET_KEY para guardar cambios reales."
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Horarios"
        description={`Gestiona los bloques de apertura visibles en la web de ${settings.site_name}.`}
        icon={CalendarClock}
        eyebrow="Datos del Gym · Horarios"
      />
      {warning ? <DashboardNotice message={warning} /> : null}
      {disabledReason ? <DashboardNotice message={disabledReason} /> : null}
      <AdminSection
        title="Horarios de apertura"
        description="Edita los bloques de horario (ej: L-V, Sab, Dom) que apareceran en la web."
        icon={CalendarClock}
      >
        <MarketingScheduleForm scheduleRows={scheduleRows} disabledReason={disabledReason} />
      </AdminSection>
    </div>
  );
}
