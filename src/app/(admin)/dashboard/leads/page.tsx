import { 
  Inbox, 
  MessageCircleMore, 
  PhoneCall, 
  SearchCheck, 
  Users, 
  Filter, 
  Zap, 
  Target
} from "lucide-react";

import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminSection from "@/components/admin/AdminSection";
import AdminSurface from "@/components/admin/AdminSurface";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import LeadsTable from "@/components/admin/LeadsTable";
import LeadsToolbar from "@/components/admin/LeadsToolbar";
import { countLeadsByStatus } from "@/lib/admin-dashboard";
import { getDashboardCapabilities } from "@/lib/auth";
import {
  DEFAULT_LEAD_FILTERS,
  filterAndSortLeads,
  getAvailableSources,
  parseLeadFilters,
} from "@/lib/data/leads";
import { getDashboardData } from "@/lib/data/site";
import { Badge } from "@/components/ui/badge";

export default async function DashboardLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filters = parseLeadFilters(params);

  const { leads, warning } = await getDashboardData();
  const { isReadOnly } = await getDashboardCapabilities();

  const availableSources = getAvailableSources(leads);
  const filteredLeads = filterAndSortLeads(leads, filters);
  const totalSummary = countLeadsByStatus(leads); // Resumen de TODO para contexto
  const currentSummary = countLeadsByStatus(filteredLeads); // Resumen del FILTRO
  
  const hasActiveFilters =
    filters.q !== DEFAULT_LEAD_FILTERS.q ||
    filters.status !== DEFAULT_LEAD_FILTERS.status ||
    filters.source !== DEFAULT_LEAD_FILTERS.source ||
    filters.sort !== DEFAULT_LEAD_FILTERS.sort;

  const disabledReason = isReadOnly
    ? "Modo lectura: SUPABASE_SERVICE_ROLE_KEY no configurada."
    : undefined;

  return (
    <div className="space-y-10">
      {/* HEADER PRO */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-black/5 pb-8">
        <DashboardPageHeader
          title="LEADS ENGINE"
          description="Seguimiento de conversiones y gestion comercial de prospectos."
          icon={Target}
          eyebrow="Revenue & Growth"
          className="pb-0"
        />
        <div className="flex items-center gap-4 bg-[#111111] p-4 shadow-xl">
           <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Tasa de Cierre</p>
              <p className="text-sm font-bold text-white uppercase tracking-tighter">
                {Math.round((totalSummary.closed / (leads.length || 1)) * 100)}% Conversion
              </p>
           </div>
           <div className="h-10 w-1 bg-[#d71920]" />
        </div>
      </div>

      {warning && <DashboardNotice message={warning} tone="warning" />}
      {disabledReason && <DashboardNotice message={disabledReason} tone="muted" />}

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[320px_1fr]">
        
        {/* SIDEBAR: CONTROL & ANALYTICS */}
        <aside className="space-y-8">
          <div className="sticky top-24 space-y-8">
            
            {/* KPI FOCUS */}
            <AdminSurface className="p-0 overflow-hidden border-black/10 shadow-lg bg-white">
              <div className="bg-[#111111] p-5 text-white flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 text-center">Filtros Activos</p>
                <Filter className="h-3 w-3 text-[#d71920]" />
              </div>
              <div className="p-6 space-y-6">
                <LeadsToolbar
                  key={`${filters.q}|${filters.status}|${filters.source}|${filters.sort}`}
                  filters={filters}
                  availableSources={availableSources}
                  disabledReason={disabledReason}
                  // Nota: El toolbar se integra aqui como panel de control
                />
                
                <div className="h-px bg-black/5" />
                
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Visibles</span>
                      <Badge variant="default" className="font-black uppercase text-[10px]">{filteredLeads.length}</Badge>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Nuevos</span>
                      <Badge variant={currentSummary.new ? "warning" : "muted"} className="font-black uppercase text-[10px]">{currentSummary.new}</Badge>
                   </div>
                </div>
              </div>
            </AdminSurface>

            {/* PERFORMANCE CARD */}
            <div className="bg-[#fbfbf8] border border-black/10 p-6 space-y-4 shadow-sm">
               <div className="flex items-center gap-2 text-[#d71920]">
                  <Zap className="h-4 w-4 fill-current" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Velocity Tip</p>
               </div>
               <p className="text-xs font-bold text-[#111111] leading-relaxed">
                  Los leads contactados en menos de <span className="text-[#d71920]">15 minutos</span> tienen un 300% mas de probabilidad de cierre.
               </p>
            </div>

            {/* QUICK STATS VERTICAL */}
            <div className="space-y-3">
               <div className="bg-white border border-black/10 p-4 flex items-center justify-between group hover:border-[#111111] transition-all">
                  <div>
                    <p className="text-[9px] font-black uppercase text-[#7a7f87]">Total Historico</p>
                    <p className="text-xl font-display font-black text-[#111111]">{leads.length}</p>
                  </div>
                  <Users className="h-5 w-5 text-black/5 group-hover:text-[#111111] transition-all" />
               </div>
               <div className="bg-white border border-black/10 p-4 flex items-center justify-between group hover:border-[#111111] transition-all">
                  <div>
                    <p className="text-[9px] font-black uppercase text-[#7a7f87]">Contactados</p>
                    <p className="text-xl font-display font-black text-[#111111]">{totalSummary.contacted}</p>
                  </div>
                  <PhoneCall className="h-5 w-5 text-black/5 group-hover:text-amber-500 transition-all" />
               </div>
            </div>

          </div>
        </aside>

        {/* MAIN: BADEJA DE OPERACIONES */}
        <main className="space-y-8 min-w-0">
          
          <div className="grid gap-4 md:grid-cols-3">
            <AdminMetricCard
              label="PENDIENTES"
              value={String(currentSummary.new)}
              hint="Requieren accion inmediata."
              icon={Inbox}
              tone={currentSummary.new ? "warning" : "success"}
              className="border-none shadow-md"
            />
            <AdminMetricCard
              label="EN PROCESO"
              value={String(currentSummary.contacted)}
              hint="Seguimiento activo."
              icon={PhoneCall}
              tone="muted"
              className="border-none shadow-md"
            />
            <AdminMetricCard
              label="CERRADOS"
              value={String(currentSummary.closed)}
              hint="Exito o archivado."
              icon={MessageCircleMore}
              tone="success"
              className="border-none shadow-md"
            />
          </div>

          <AdminSection
            title="OPERATIONAL QUEUE"
            description="Gestiona tus prospectos con el maximo detalle operativo."
            icon={SearchCheck}
            className="mt-0"
          >
            <div className="bg-white border border-black/10 shadow-sm overflow-hidden">
              <LeadsTable
                leads={filteredLeads}
                disabledReason={disabledReason}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </AdminSection>
        </main>

      </div>
    </div>
  );
}
