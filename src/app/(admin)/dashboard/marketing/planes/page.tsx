import { Tag } from "lucide-react";

import AdminSection from "@/components/admin/AdminSection";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import MarketingPlansForm from "@/components/admin/MarketingPlansForm";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardMarketingData } from "@/lib/data/site";

export default async function DashboardMarketingPlanesPage() {
  const { settings, plans, warning } = await getDashboardMarketingData();
  const { isReadOnly } = await getDashboardCapabilities();
  const disabledReason = isReadOnly
    ? "Configura SUPABASE_SECRET_KEY para guardar cambios reales."
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Planes"
        description={`Gesiona los planes de suscripcion visibles en la web de ${settings.site_name}.`}
        icon={Tag}
        eyebrow="Marketing · Planes"
      />
      {warning ? <DashboardNotice message={warning} /> : null}
      {disabledReason ? <DashboardNotice message={disabledReason} /> : null}
      <AdminSection
        title="Planes de suscripcion"
        description="Edita nombre, precio, destacado y bullets del bloque comercial."
        icon={Tag}
      >
        <MarketingPlansForm plans={plans} disabledReason={disabledReason} />
      </AdminSection>
    </div>
  );
}
