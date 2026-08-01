import { MessageSquareQuote, Megaphone } from "lucide-react";

import AdminSection from "@/components/admin/AdminSection";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import MarketingTestimonialsModerationPanel from "@/components/admin/MarketingTestimonialsModerationPanel";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardMarketingData } from "@/lib/data/site";

export default async function DashboardMarketingPage() {
  const { settings, testimonials, warning } = await getDashboardMarketingData();
  const { isReadOnly } = await getDashboardCapabilities();
  const disabledReason = isReadOnly
    ? "Configura SUPABASE_SECRET_KEY para guardar cambios reales."
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Marketing"
        description={`Resenas y contenido comercial de ${settings.site_name}.`}
        icon={Megaphone}
        eyebrow="Marketing"
      />
      {warning ? <DashboardNotice message={warning} /> : null}
      {disabledReason ? <DashboardNotice message={disabledReason} /> : null}
      <AdminSection
        id="resenas"
        title="Moderacion de resenas"
        description="Aprueba o rechaza las resenas enviadas por socios desde Mi cuenta. Solo las aprobadas aparecen en la portada."
        icon={MessageSquareQuote}
      >
        <MarketingTestimonialsModerationPanel
          testimonials={testimonials}
          disabledReason={disabledReason}
        />
      </AdminSection>
    </div>
  );
}
