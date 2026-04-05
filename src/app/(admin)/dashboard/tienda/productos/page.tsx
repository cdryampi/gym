import { 
  PackageSearch, 
  ShoppingBag, 
  Plus, 
  Tag, 
  TrendingUp,
  BarChart4,
  LayoutGrid
} from "lucide-react";
import Link from "next/link";

import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminSection from "@/components/admin/AdminSection";
import AdminSurface from "@/components/admin/AdminSurface";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import StoreProductsTable from "@/components/admin/StoreProductsTable";
import { getStoreAdminSnapshot } from "@/lib/data/store-admin";

export default async function DashboardStoreProductsPage() {
  const snapshot = await getStoreAdminSnapshot();
  const totalProducts = snapshot.products.length;
  const activeProducts = snapshot.products.filter(p => p.active).length;
  const inStock = snapshot.products.filter(p => p.stock_status === 'in_stock').length;

  return (
    <div className="space-y-10">
      {/* HEADER PRO */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-black/5 pb-8">
        <DashboardPageHeader
          title="CATALOGO PRO"
          description="Gestion maestra de inventario, precios y visualizacion de la tienda."
          icon={Tag}
          eyebrow="Retail Control"
          className="pb-0"
        />
        <Link
          href="/dashboard/tienda/productos/nuevo"
          className="bg-[#111111] text-white px-8 h-12 flex items-center gap-3 font-black uppercase tracking-widest hover:bg-[#d71920] transition-all shadow-xl"
        >
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Link>
      </div>

      {snapshot.warning && <DashboardNotice message={snapshot.warning} tone="warning" />}

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_320px]">
        
        {/* MAIN: LISTADO DE PRODUCTOS */}
        <main className="space-y-12 min-w-0">
          
          <div className="grid gap-4 md:grid-cols-3">
            <AdminMetricCard
              label="TOTAL ITEMS"
              value={String(totalProducts)}
              hint="Referencias en base."
              icon={ShoppingBag}
              className="border-none shadow-md"
            />
            <AdminMetricCard
              label="PUBLICADOS"
              value={String(activeProducts)}
              hint="Visibles en storefront."
              tone="success"
              icon={TrendingUp}
              className="border-none shadow-md"
            />
            <AdminMetricCard
              label="EN STOCK"
              value={String(inStock)}
              hint="Disponibilidad inmediata."
              tone="warning"
              icon={PackageSearch}
              className="border-none shadow-md"
            />
          </div>

          <AdminSection
            title="INVENTARIO OPERATIVO"
            description="Control total sobre descripciones, precios y estados de stock."
            icon={LayoutGrid}
            className="mt-0"
          >
            <StoreProductsTable products={snapshot.products} />
          </AdminSection>
        </main>

        {/* SIDEBAR: RETAIL INSIGHTS */}
        <aside className="space-y-8">
          <div className="sticky top-24 space-y-8">
            
            <div className="bg-[#111111] p-6 text-white shadow-xl">
               <div className="flex items-center gap-3 mb-6">
                  <BarChart4 className="h-4 w-4 text-[#d71920]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Retail Metrics</p>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                       <span>Salud del Stock</span>
                       <span className="text-green-500">{Math.round((inStock / (totalProducts || 1)) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-white/10 overflow-hidden">
                       <div className="h-full bg-green-500" style={{ width: `${(inStock / (totalProducts || 1)) * 100}%` }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                       <span>Publicacion</span>
                       <span className="text-[#d71920]">{Math.round((activeProducts / (totalProducts || 1)) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-white/10 overflow-hidden">
                       <div className="h-full bg-[#d71920]" style={{ width: `${(activeProducts / (totalProducts || 1)) * 100}%` }} />
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-[#fbfbf8] border border-black/10 p-6 space-y-4 shadow-sm">
               <div className="flex items-center gap-2 text-[#111111]">
                  <Tag className="h-4 w-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Retail Tip</p>
               </div>
               <p className="text-[11px] font-medium text-[#7a7f87] leading-relaxed italic">
                  &quot;Los productos con comparativa de precio (descuento) tienen un <span className="text-[#d71920] font-black">40% mas</span> de clics en el sitio publico.&quot;
               </p>
            </div>

            <AdminSurface inset className="p-6 border-l-4 border-[#111111] bg-white">
               <p className="text-[9px] font-black uppercase text-[#7a7f87] mb-2">Checkout Info</p>
               <p className="text-xs font-bold text-[#111111] leading-relaxed">
                 Asegurate de completar el precio de <span className="text-blue-600 font-black">PayPal USD</span> para que los socios puedan pagar con tarjeta desde la web.
               </p>
            </AdminSurface>

          </div>
        </aside>

      </div>
    </div>
  );
}
