import AdminSection from "@/components/admin/AdminSection";
import CmsDocumentsForm from "@/components/admin/CmsDocumentsForm";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardCmsSnapshot } from "@/lib/supabase/queries";

export default async function DashboardCmsPage() {
  const snapshot = await getDashboardCmsSnapshot();
  const { isReadOnly } = await getDashboardCapabilities();
  const disabledReason = isReadOnly
    ? "Configura SUPABASE_SERVICE_ROLE_KEY para guardar contenido legal y de sistema."
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Legales y errores"
        description="Gestiona las paginas legales, el banner de cookies y los textos genericos de fallback desde un CMS simple."
      />
      {snapshot.warning ? <DashboardNotice message={snapshot.warning} /> : null}
      {disabledReason ? <DashboardNotice message={disabledReason} /> : null}

      <AdminSection
        title="CMS legal y sistema"
        description="Cada documento se publica por separado y la web usa fallback local si Supabase no responde."
      >
        <CmsDocumentsForm documents={snapshot.documents} disabledReason={disabledReason} />
      </AdminSection>
    </div>
  );
}
