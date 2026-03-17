import Link from "next/link";

import AdminSection from "@/components/admin/AdminSection";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import StoreProductsTable from "@/components/admin/StoreProductsTable";
import { getStoreAdminSnapshot } from "@/lib/data/store-admin";

export default async function DashboardStoreProductsPage() {
  const snapshot = await getStoreAdminSnapshot();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Productos"
        description="CRUD basico del catalogo interno con categoria raiz, subcategoria, precio y estado."
      />

      {snapshot.warning ? <DashboardNotice message={snapshot.warning} /> : null}

      <AdminSection
        title="Catalogo editable"
        description="Gestiona naming, posicion, precio, estado y contenido de ficha desde el panel."
        badge={
          <Link
            href="/dashboard/tienda/productos/nuevo"
            className="rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-[#111111]"
          >
            Nuevo producto
          </Link>
        }
      >
        <StoreProductsTable products={snapshot.products} />
      </AdminSection>
    </div>
  );
}
