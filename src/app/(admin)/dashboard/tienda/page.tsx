import { 
  ShoppingBag, 
  Tag, 
  Layers, 
  Truck, 
  ArrowUpRight,
  Database,
  BarChart4
} from "lucide-react";
import Link from "next/link";

import AdminMetricCard from "@/components/admin/AdminMetricCard";
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
  const subcategoriesCount = snapshot.categories.filter((category) => category.parent_id).length;

  return (
    <div className="space-y-10">
      {/* HEADER PRO */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-black/5 pb-8">
        <DashboardPageHeader
          title="RETAIL CONSOLE"
          description="Control de inventario, taxonomias y logistica de recogida local."
          icon={ShoppingBag}
          eyebrow="Commerce Engine"
          className="pb-0"
        />
        <div className="flex items-center gap-4 bg-white border border-black/10 p-4 shadow-sm">
           <Database className="h-5 w-5 text-amber-500" />
           <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Data Source</p>
              <p className="text-sm font-bold text-[#111111] uppercase tracking-tighter">{sourceMeta.label}</p>
           </div>
        </div>
      </div>

      {snapshot.warning && <DashboardNotice message={snapshot.warning} tone="warning" />}

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_340px]">
        
        {/* MAIN: METRICAS Y ACCIONES */}
        <main className="space-y-12">
          
          <div className="grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <AdminMetricCard key={metric.label} {...metric} className="border-none shadow-md hover:shadow-xl transition-all" />
            ))}
          </div>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
               <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-[#111111]">Gestion Operativa</h2>
               <div className="h-px flex-1 bg-black/10" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
               <Link href="/dashboard/tienda/productos" className="group relative bg-[#111111] p-8 overflow-hidden transition-all hover:bg-black">
                  <div className="relative z-10 space-y-4">
                    <Tag className="h-8 w-8 text-white/20 group-hover:text-[#d71920] transition-colors" />
                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter">Catalogo Pro</h3>
                    <p className="text-sm text-white/60 leading-relaxed max-w-[240px]">Edita descripciones, precios y visibilidad de productos.</p>
                    <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
                       Entrar al Catalogo <ArrowUpRight className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-white/5 rounded-full blur-3xl group-hover:bg-[#d71920]/10 transition-all" />
               </Link>

               <Link href="/dashboard/tienda/categorias" className="group relative bg-white border border-black/10 p-8 overflow-hidden transition-all hover:border-[#111111]">
                  <div className="relative z-10 space-y-4">
                    <Layers className="h-8 w-8 text-black/10 group-hover:text-[#111111] transition-colors" />
                    <h3 className="text-2xl font-display font-black text-[#111111] uppercase tracking-tighter">Taxonomia</h3>
                    <p className="text-sm text-[#7a7f87] leading-relaxed max-w-[240px]">Organiza la jerarquia de categorias y subcategorias.</p>
                    <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#111111]">
                       Configurar Arbol <ArrowUpRight className="h-3 w-3" />
                    </div>
                  </div>
               </Link>
            </div>

            <AdminSurface inset className="p-8 border-l-4 border-amber-500 bg-[#fbfbf8]">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Estructura Storefront</p>
                    <h4 className="text-xl font-bold text-[#111111] uppercase tracking-tight">Jerarquia de Navegacion</h4>
                    <p className="text-sm text-[#5f6368] leading-relaxed max-w-xl">
                      Actualmente el sitio publico renderiza <span className="font-bold text-[#111111]">{categoryTree.length} categorias principales</span> y <span className="font-bold text-[#111111]">{subcategoriesCount} sub-niveles</span> de filtrado tecnico.
                    </p>
                  </div>
                  <div className="flex gap-4">
                     <div className="text-center">
                        <p className="text-2xl font-display font-black text-[#111111]">{categoryTree.length}</p>
                        <p className="text-[9px] font-black uppercase text-[#7a7f87]">Roots</p>
                     </div>
                     <div className="w-px h-10 bg-black/5" />
                     <div className="text-center">
                        <p className="text-2xl font-display font-black text-[#111111]">{subcategoriesCount}</p>
                        <p className="text-[9px] font-black uppercase text-[#7a7f87]">Leafs</p>
                     </div>
                  </div>
               </div>
            </AdminSurface>
          </section>
        </main>

        {/* SIDEBAR: LOGISTICA Y ESTADO */}
        <aside className="space-y-8">
          <div className="sticky top-24 space-y-8">
            
            <div className="bg-[#111111] p-6 text-white shadow-xl">
               <div className="flex items-center gap-3 mb-6">
                  <BarChart4 className="h-4 w-4 text-[#d71920]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Inventario Snapshot</p>
               </div>
               <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-white/5 pb-4">
                     <p className="text-[10px] font-bold uppercase text-white/60 tracking-wider">Productos Totales</p>
                     <p className="text-3xl font-display font-black text-white leading-none">{snapshot.products.length}</p>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/5 pb-4">
                     <p className="text-[10px] font-bold uppercase text-white/60 tracking-wider">En Catalogo</p>
                     <p className="text-3xl font-display font-black text-white leading-none">{snapshot.products.filter(p => !p.pickup_only).length}</p>
                  </div>
                  <div className="flex justify-between items-end">
                     <p className="text-[10px] font-bold uppercase text-white/60 tracking-wider">Recogida Club</p>
                     <p className="text-3xl font-display font-black text-[#d71920] leading-none">{snapshot.products.filter(p => p.pickup_only).length}</p>
                  </div>
               </div>
            </div>

            <Link href="/dashboard/tienda/pedidos" className="group block bg-[#fff3f3] border border-[#d71920]/10 p-6 space-y-4 hover:border-[#d71920] transition-all">
               <div className="flex items-center justify-between">
                  <Truck className="h-5 w-5 text-[#d71920]" />
                  <ArrowUpRight className="h-4 w-4 text-[#d71920]/20 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-[#d71920]">Fulfillment</p>
               <p className="text-sm font-bold text-[#111111] leading-relaxed">
                  Gestiona las ordenes de <span className="font-black">Click & Collect</span> realizadas desde el sitio publico.
               </p>
            </Link>

            <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111] px-2">Data Integrity</h3>
               <div className="bg-white border border-black/10 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] font-bold uppercase text-[#7a7f87]">Source Status</p>
                     <Badge variant="success" className="text-[9px] font-black uppercase">Online</Badge>
                  </div>
                  <div className="h-px bg-black/5" />
                  <p className="text-[10px] leading-relaxed text-[#7a7f87]">
                    Sincronizado con el provider <span className="text-[#111111] font-bold uppercase">{snapshot.source}</span>. Los cambios pueden tardar hasta 2 min en reflejarse en el edge.
                  </p>
               </div>
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
}
