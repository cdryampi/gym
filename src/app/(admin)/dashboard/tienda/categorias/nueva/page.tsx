import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import StoreCategoryForm from "@/components/admin/StoreCategoryForm";
import { getDashboardCapabilities } from "@/lib/auth";
import { getStoreAdminSnapshot } from "@/lib/data/store-admin";

export default async function DashboardNewStoreCategoryPage() {
  const [snapshot, capabilities] = await Promise.all([
    getStoreAdminSnapshot(),
    getDashboardCapabilities(),
  ]);

  const disabledReason = capabilities.isReadOnly
    ? "Configura SUPABASE_SERVICE_ROLE_KEY para guardar cambios reales."
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Nueva categoria"
        description="Crea una categoria raiz o una subcategoria bajo una raiz existente."
      />
      {snapshot.warning ? <DashboardNotice message={snapshot.warning} /> : null}
      {disabledReason ? <DashboardNotice message={disabledReason} /> : null}
      <StoreCategoryForm categories={snapshot.categories} disabledReason={disabledReason} />
    </div>
  );
}
