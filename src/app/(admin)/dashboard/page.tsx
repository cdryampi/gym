import {
  ShieldCheck,
  ShoppingBag,
  Users,
  ArrowUpRight,
  Activity,
  Zap
} from "lucide-react";
import Link from "next/link";

import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminSurface from "@/components/admin/AdminSurface";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import {
  buildCommerceMetrics,
  buildDashboardMetrics,
  countLeadsByStatus,
  getCommerceSourceMeta,
  getTopbarStatusMeta,
} from "@/lib/admin-dashboard";
import { getOrderedTrainingZones } from "@/data/training-zones";
import { novaForzaHomeContent } from "@/lib/data/nova-forza-content";
import { getDashboardData } from "@/lib/data/site";
import { getStoreAdminSnapshot } from "@/lib/data/store-admin";
import { resolveTopbarStatus } from "@/lib/topbar";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const [{ leads, settings, warning }, storeSnapshot] = await Promise.all([
    getDashboardData(),
    getStoreAdminSnapshot(),
  ]);

  const leadSummary = countLeadsByStatus(leads);
  const newLeads = leadSummary.new;
  const topbarMeta = getTopbarStatusMeta(resolveTopbarStatus(settings));
  const leadMetrics = buildDashboardMetrics(leads, newLeads);
  const commerceMetrics = buildCommerceMetrics(storeSnapshot.products, storeSnapshot.source, {
    warning: storeSnapshot.warning,
  });
  const commerceMeta = getCommerceSourceMeta(storeSnapshot.source, {
    warning: storeSnapshot.warning,
  });
  
  const inventory = [
    { label: "Zonas entrenamiento", value: String(getOrderedTrainingZones().length), icon: ShieldCheck, color: "text-blue-600" },
    { label: "Productos tienda", value: String(storeSnapshot.products.length), icon: ShoppingBag, color: "text-amber-600" },
    { label: "Equipo tecnico", value: String(novaForzaHomeContent.team.length), icon: Users, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-10">
      {/* HEADER PRO */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-black/5 pb-8">
        <DashboardPageHeader
          title="COMMAND CENTER"
          description="Monitoreo en tiempo real de la operacion, captacion y salud comercial del club."
          icon={Activity}
          eyebrow="Dashboard v2.0"
          className="pb-0"
        />
        <div className="flex items-center gap-4 bg-white border border-black/10 p-4 shadow-sm">
           <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Status Global</p>
              <p className="text-sm font-bold text-[#111111] uppercase tracking-tighter">Operativo · Online</p>
           </div>
           <div className="h-10 w-1 bg-green-500" />
        </div>
      </div>

      {warning || storeSnapshot.warning ? (
        <div className="space-y-2">
           {warning && <DashboardNotice message={warning} tone="warning" />}
           {storeSnapshot.warning && <DashboardNotice message={storeSnapshot.warning} tone="muted" />}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_380px]">
        {/* COLUMNA PRINCIPAL: PRIORIDADES */}
        <div className="space-y-12">
          
          {/* SECCION LEADS: CAPTACION */}
          <section className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-[#d71920] text-white">
                  <Zap className="h-5 w-5" />
                </div>
                <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-[#111111]">
                  Captacion
                </h2>
              </div>
              <Link href="/dashboard/leads" className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87] hover:text-[#d71920] transition-colors flex items-center gap-2">
                Ver embudo completo <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              {leadMetrics.map((metric) => (
                <AdminMetricCard key={metric.label} {...metric} className="border-none shadow-md hover:shadow-xl transition-all" />
              ))}
            </div>

            <AdminSurface inset className="p-6 border-l-4 border-[#d71920]">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-[#111111] uppercase tracking-wide">Eficiencia del embudo</p>
                    <p className="text-sm text-[#5f6368] leading-relaxed">
                      De los <span className="font-bold text-[#111111]">{leads.length}</span> contactos totales, un <span className="font-bold text-[#d71920]">{Math.round(((leadSummary.contacted + leadSummary.closed) / leads.length) * 100)}%</span> ha sido procesado por el equipo comercial.
                    </p>
                  </div>
                  <div className="flex -space-x-3">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-black/5 flex items-center justify-center text-[10px] font-bold">U{i}</div>
                     ))}
                  </div>
               </div>
            </AdminSurface>
          </section>

          {/* SECCION COMERCIO: TIENDA */}
          <section className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-[#111111] text-white">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-[#111111]">
                  Commerce
                </h2>
              </div>
              <Link href="/dashboard/tienda" className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87] hover:text-[#111111] transition-colors flex items-center gap-2">
                Gestionar catalogo <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              {commerceMetrics.map((metric) => (
                <AdminMetricCard key={metric.label} {...metric} className="border-none shadow-md" />
              ))}
            </div>
          </section>

        </div>

        {/* SIDEBAR: SALUD Y ESTADO */}
        <aside className="space-y-8">
          <div className="sticky top-24 space-y-8">
            
            {/* STATUS CARD */}
            <AdminSurface className="p-0 overflow-hidden border-black/10 shadow-lg bg-white">
              <div className="bg-[#111111] p-6 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 text-center">Identidad Digital</p>
                <h3 className="mt-4 text-center font-display text-2xl font-black uppercase leading-tight tracking-tighter">
                  {settings.site_name}
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#7a7f87]">Tagline activo</p>
                  <p className="text-sm font-medium leading-relaxed text-[#111111] italic">&quot;{settings.site_tagline}&quot;</p>
                </div>
                
                <div className="h-px bg-black/5" />
                
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Marketing</span>
                      <Badge variant={topbarMeta.tone} className="font-black uppercase tracking-tighter text-[9px]">{topbarMeta.label}</Badge>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Catalogo</span>
                      <Badge variant={commerceMeta.tone} className="font-black uppercase tracking-tighter text-[9px]">{commerceMeta.label}</Badge>
                   </div>
                </div>

                <div className="bg-[#fbfbf8] p-4 border border-black/5">
                   <p className="text-[9px] font-black uppercase tracking-widest text-[#7a7f87] mb-2">Promo activa</p>
                   <p className="text-xs font-bold text-[#111111] leading-relaxed">
                      {settings.topbar_text || "Sin promocion destacada en el sitio publico."}
                   </p>
                </div>
              </div>
            </AdminSurface>

            {/* INVENTARIO VISUAL */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111] px-2">Inventario Publico</h3>
              <div className="grid gap-2">
                {inventory.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="group flex items-center justify-between bg-white border border-black/10 p-4 transition-all hover:border-[#111111] hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className={cn("flex h-10 w-10 items-center justify-center bg-[#fbfbf8] group-hover:bg-[#111111] group-hover:text-white transition-all", item.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">{item.label}</p>
                          <p className="text-lg font-display font-black text-[#111111] leading-none mt-1">{item.value}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-black/10 group-hover:text-[#111111] transition-all" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="bg-[#fff3f3] border border-[#d71920]/10 p-6 space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-[#d71920]">Atencion Requerida</p>
               <p className="text-sm font-bold text-[#111111] leading-relaxed">
                  Tienes <span className="text-[#d71920]">{newLeads} leads nuevos</span> esperando respuesta. La velocidad de contacto define el cierre.
               </p>
               <Link href="/dashboard/leads" className="inline-block bg-[#d71920] text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 hover:bg-[#111111] transition-colors">
                  Atender Leads
               </Link>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}
