import { CalendarClock, Megaphone, MessageSquareQuote } from "lucide-react";

import AdminSection from "@/components/admin/AdminSection";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import MarketingContentForm from "@/components/admin/MarketingContentForm";
import MarketingTestimonialsModerationPanel from "@/components/admin/MarketingTestimonialsModerationPanel";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardMarketingData } from "@/lib/data/site";

export default async function DashboardMarketingPage() {
  const { settings, plans, scheduleRows, testimonials, warning } = await getDashboardMarketingData();
  const { isReadOnly } = await getDashboardCapabilities();
  const disabledReason = isReadOnly
    ? "Configura SUPABASE_SERVICE_ROLE_KEY para guardar cambios reales."
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Marketing"
        description={`Gestiona planes y horarios visibles de ${settings.site_name}.`}
        icon={Megaphone}
        eyebrow="Contenido comercial"
      />
      {warning ? <DashboardNotice message={warning} /> : null}
      {disabledReason ? <DashboardNotice message={disabledReason} /> : null}
      <AdminSection
        title="Contenido comercial editable"
        description="Opera los bloques publicos de planes y horarios desde una sola pantalla."
        icon={CalendarClock}
      >
        <MarketingContentForm
          plans={plans}
          scheduleRows={scheduleRows}
          disabledReason={disabledReason}
        />
      </AdminSection>
      <AdminSection
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
