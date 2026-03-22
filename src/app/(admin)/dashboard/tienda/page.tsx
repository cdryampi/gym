import Link from "next/link";

import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminSection from "@/components/admin/AdminSection";
import AdminSurface from "@/components/admin/AdminSurface";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import { buildStoreCategoryTree } from "@/lib/data/store";
import { getStoreAdminSnapshot } from "@/lib/data/store-admin";
import { buildCommerceMetrics, getCommerceSourceMeta } from "@/lib/admin-dashboard";

export default async function DashboardStorePage() {
  const snapshot = await getStoreAdminSnapshot();
  const sourceMeta = getCommerceSourceMeta(snapshot.source, {
    warning: snapshot.warning,
  });
  const metrics = buildCommerceMetrics(snapshot.products, snapshot.source, {
    warning: snapshot.warning,
  });
  const categoryTree = buildStoreCategoryTree(snapshot.categories);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Tienda"
        description="Resumen operativo de taxonomy, catalogo y edicion interna de la tienda."
      />

      {snapshot.warning ? <DashboardNotice message={snapshot.warning} /> : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {metrics.map((metric) => (
          <AdminMetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <AdminSection
        title="Estado actual"
        description="Gestion operativa del catalogo segun el provider configurado para el dashboard."
        badge={<Badge variant={sourceMeta.tone}>{sourceMeta.label}</Badge>}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <AdminSurface inset className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
              Categorias raiz
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#111111]">{categoryTree.length}</p>
          </AdminSurface>
          <AdminSurface inset className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
              Subcategorias
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#111111]">
              {snapshot.categories.filter((category) => category.parent_id).length}
            </p>
          </AdminSurface>
          <AdminSurface inset className="flex flex-col justify-between gap-3 p-4">
            <p className="text-sm leading-6 text-[#5f6368]">
              Usa las vistas dedicadas para crear categorias, asignar subcategorias y editar el
              catalogo sin romper el storefront actual.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/tienda/categorias"
                className="rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-[#111111]"
              >
                Gestionar categorias
              </Link>
              <Link
                href="/dashboard/tienda/productos"
                className="rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-[#111111]"
              >
                Gestionar productos
              </Link>
              <Link
                href="/dashboard/tienda/pedidos"
                className="rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-[#111111]"
              >
                Ver pedidos pickup
              </Link>
            </div>
          </AdminSurface>
        </div>
      </AdminSection>
    </div>
  );
}
