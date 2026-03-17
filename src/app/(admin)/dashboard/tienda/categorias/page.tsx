import Link from "next/link";

import AdminSection from "@/components/admin/AdminSection";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import StoreCategoriesTable from "@/components/admin/StoreCategoriesTable";
import { buildStoreCategoryTree } from "@/lib/data/store";
import { getStoreAdminSnapshot } from "@/lib/data/store-admin";

export default async function DashboardStoreCategoriesPage() {
  const snapshot = await getStoreAdminSnapshot();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Categorias"
        description="Jerarquia simple padre/hija para organizar el catalogo del dashboard."
      />

      {snapshot.warning ? <DashboardNotice message={snapshot.warning} /> : null}

      <AdminSection
        title="Taxonomia de tienda"
        description="Las categorias raiz sostienen filtros publicos. Las hijas organizan el catalogo interno."
        badge={
          <Link
            href="/dashboard/tienda/categorias/nueva"
            className="rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-[#111111]"
          >
            Nueva categoria
          </Link>
        }
      >
        <StoreCategoriesTable categories={buildStoreCategoryTree(snapshot.categories)} />
      </AdminSection>
    </div>
  );
}
