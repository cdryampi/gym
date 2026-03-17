import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import StoreProductForm from "@/components/admin/StoreProductForm";
import { getDashboardCapabilities } from "@/lib/auth";
import { getStoreAdminSnapshot } from "@/lib/data/store-admin";

export default async function DashboardNewStoreProductPage() {
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
        title="Nuevo producto"
        description="Crea un producto y asignalo a una subcategoria valida de la tienda."
      />
      {snapshot.warning ? <DashboardNotice message={snapshot.warning} /> : null}
      {disabledReason ? <DashboardNotice message={disabledReason} /> : null}
      <StoreProductForm categories={snapshot.categories} disabledReason={disabledReason} />
    </div>
  );
}
