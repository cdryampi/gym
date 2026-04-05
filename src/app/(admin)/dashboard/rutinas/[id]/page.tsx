import { notFound } from "next/navigation";

import AdminSection from "@/components/admin/AdminSection";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import RoutineTemplateForm from "@/components/admin/RoutineTemplateForm";
import AdminSurface from "@/components/admin/AdminSurface";
import { getDashboardRoutineTemplateDetail } from "@/lib/data/gym-management";
import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "@/lib/utils";
import { LayoutTemplate } from "lucide-react";

export default async function DashboardRoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getDashboardRoutineTemplateDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <DashboardPageHeader
          title={detail.template.title}
          description="Diseñador visual de entrenamiento operativo."
          icon={LayoutTemplate}
          eyebrow={`Rutina · ID: ${detail.template.slug}`}
          className="pb-0"
        />
        <div className="flex items-center gap-3">
           <Badge variant={detail.isActive ? "success" : "muted"} className="h-8 px-4 text-[10px] font-black uppercase tracking-widest">
            {detail.isActive ? "Publicada" : "Borrador"}
          </Badge>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a7f87]">Ultima edicion</p>
            <p className="text-sm font-semibold text-[#111111]">{formatShortDate(detail.template.updatedAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[380px_1fr]">
        {/* SIDEBAR: Metadata & Control */}
        <aside className="space-y-6">
          <div className="sticky top-24 space-y-6">
            <AdminSurface className="p-0 overflow-hidden border-black/10 shadow-sm">
              <div className="bg-[#111111] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Configuracion Pro</p>
              </div>
              <div className="p-5 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a7f87]">Miembros</p>
                    <p className="text-2xl font-display font-bold text-[#111111]">{detail.assignedMembers.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a7f87]">Impacto</p>
                    <p className="text-2xl font-display font-bold text-[#111111]">{detail.template.exerciseCount * detail.assignedMembers.length}</p>
                  </div>
                </div>
                
                <div className="h-px bg-black/5" />
                
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-[#7a7f87]">Dificultad</span>
                      <Badge variant="muted" className="bg-black/5 font-bold">{detail.template.difficultyLabel}</Badge>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-[#7a7f87]">Intensidad</span>
                      <Badge variant="muted" className="bg-black/5 font-bold">{detail.template.intensityLabel}</Badge>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-[#7a7f87]">Duracion</span>
                      <Badge variant="muted" className="bg-black/5 font-bold">{detail.template.durationLabel}</Badge>
                   </div>
                </div>
              </div>
            </AdminSurface>

            <AdminSection 
              title="Miembros activos" 
              description="Gestion rapida de asignaciones."
              className="mt-0"
            >
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {detail.assignedMembers.length ? (
                  detail.assignedMembers.map((assignment) => (
                    <div key={assignment.assignmentId} className="group flex items-center justify-between gap-3 bg-white p-3 border border-black/5 hover:border-[#d71920]/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-bold">
                          {assignment.memberName[0]}
                        </div>
                        <p className="text-xs font-bold text-[#111111] truncate max-w-[120px]">{assignment.memberName}</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1 text-[#7a7f87] hover:text-[#d71920] transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#7a7f87] italic p-4 bg-black/5 text-center">Sin asignaciones activas.</p>
                )}
              </div>
            </AdminSection>
          </div>
        </aside>

        {/* MAIN: Editor Visual */}
        <main className="min-w-0">
          <RoutineTemplateForm detail={detail} />
        </main>
      </div>
    </div>
  );
}
