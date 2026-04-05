import { 
  UserPlus, 
  Users, 
  Search, 
  Dumbbell, 
  ShieldCheck,
  Activity
} from "lucide-react";
import Link from "next/link";

import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminSection from "@/components/admin/AdminSection";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listDashboardMembers } from "@/lib/data/gym-management";
import { cn } from "@/lib/utils";

export default async function DashboardMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.q ?? "";
  const status = params.status ?? "";
  const members = await listDashboardMembers({
    search: search || undefined,
    status: status || undefined,
  });

  const activeMembers = members.filter((m) => m.status === "active");
  const withoutRoutine = members.filter((m) => !m.currentRoutineTitle);

  return (
    <div className="space-y-10">
      {/* HEADER PRO */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-black/5 pb-8">
        <DashboardPageHeader
          title="MEMBER SCOUTING"
          description="Gestion operativa de la base de socios, planes y asignacion de carga tecnica."
          icon={Activity}
          eyebrow="Operaciones Gym"
          className="pb-0"
        />
        <Link
          href="/dashboard/miembros/nuevo"
          className="bg-[#111111] text-white px-8 h-12 flex items-center gap-3 font-black uppercase tracking-widest hover:bg-[#d71920] transition-all shadow-xl"
        >
          <UserPlus className="h-4 w-4" />
          Registrar Socio
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_320px]">
        
        {/* MAIN: BANDEJA DE MIEMBROS */}
        <main className="space-y-8 min-w-0">
          
          <div className="grid gap-4 md:grid-cols-3">
            <AdminMetricCard
              label="POBLACION TOTAL"
              value={String(members.length)}
              hint="Fichas registradas."
              icon={Users}
              className="border-none shadow-md"
            />
            <AdminMetricCard
              label="SOCIOS ACTIVOS"
              value={String(activeMembers.length)}
              hint="En operacion normal."
              tone="success"
              icon={ShieldCheck}
              className="border-none shadow-md"
            />
            <AdminMetricCard
              label="SIN ENTRENAMIENTO"
              value={String(withoutRoutine.length)}
              hint="Requieren rutina."
              tone="warning"
              icon={Dumbbell}
              className="border-none shadow-md"
            />
          </div>

          <AdminSection
            title="SOCIOS REGISTRADOS"
            description="Filtra por estado operativo o busca por identificador unico."
            className="mt-0"
          >
            <div className="space-y-6">
              <form className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/20" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={search}
                    placeholder="Buscar por nombre, email o ID..."
                    className="flex h-12 w-full border border-black/10 bg-[#fbfbf8] pl-11 pr-4 text-sm font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#d71920]/10 transition-all"
                  />
                </div>
                <select
                  name="status"
                  defaultValue={status}
                  className="flex h-12 w-full border border-black/10 bg-white px-4 text-xs font-bold uppercase outline-none focus:ring-1 focus:ring-[#d71920]"
                >
                  <option value="">Todos los estados</option>
                  <option value="active">Active</option>
                  <option value="prospect">Prospect</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  type="submit"
                  className="h-12 bg-white border border-black/10 px-8 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                >
                  Filtrar
                </button>
              </form>

              <div className="bg-white border border-black/10 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black/5 hover:bg-black/5 border-none">
                      <TableHead className="font-black text-[10px] uppercase text-[#111111]">Socio</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-[#111111]">Estado</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-[#111111]">Plan Activo</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-[#111111]">Carga Tecnica</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-[#111111]">Accion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id} className="group hover:bg-[#fbfbf8] transition-colors border-black/5">
                        <TableCell>
                          <div className="flex items-center gap-4 py-1">
                            <div className="h-10 w-10 shrink-0 bg-black/5 flex items-center justify-center font-bold text-[#111111]">
                              {member.fullName[0]}
                            </div>
                            <div>
                              <Link
                                href={`/dashboard/miembros/${member.id}`}
                                className="text-sm font-bold text-[#111111] hover:text-[#d71920] transition-colors uppercase tracking-tight"
                              >
                                {member.fullName}
                              </Link>
                              <p className="text-[10px] font-medium text-[#7a7f87] uppercase tracking-wide">
                                {member.memberNumber} · {member.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === "active" ? "success" : "muted"} className="font-black uppercase text-[9px] tracking-tighter">
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] font-bold text-[#111111] uppercase tracking-tighter bg-black/5 px-2 py-1">
                            {member.planLabel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn("h-1.5 w-1.5 rounded-full", member.currentRoutineTitle ? "bg-green-500" : "bg-amber-500")} />
                            <span className="text-[11px] font-medium text-[#111111] truncate max-w-[140px]">
                              {member.currentRoutineTitle ?? "SIN ASIGNAR"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/miembros/${member.id}`}
                            className="inline-flex h-8 items-center border border-black/10 bg-white px-4 text-[9px] font-black uppercase tracking-widest text-[#111111] transition-all hover:bg-[#111111] hover:text-white"
                          >
                            Ver Ficha
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </AdminSection>
        </main>

        {/* SIDEBAR: POBLACION INSIGHTS */}
        <aside className="space-y-8">
          <div className="sticky top-24 space-y-8">
            
            <div className="bg-[#111111] p-6 text-white shadow-xl">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Insights Poblacion</p>
               <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                       <span>Rutina Vigente</span>
                       <span className="text-[#d71920]">{Math.round(( (members.length - withoutRoutine.length) / (members.length || 1)) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-white/10 overflow-hidden">
                       <div className="h-full bg-[#d71920]" style={{ width: `${((members.length - withoutRoutine.length) / (members.length || 1)) * 100}%` }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                       <span>Tasa Retencion</span>
                       <span className="text-green-500">92%</span>
                    </div>
                    <div className="h-1 bg-white/10 overflow-hidden">
                       <div className="h-full bg-green-500 w-[92%]" />
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-[#fff3f3] border border-[#d71920]/10 p-6 space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-[#d71920]">Alerta Operativa</p>
               <p className="text-xs font-bold text-[#111111] leading-relaxed">
                  Hay <span className="text-[#d71920] font-black">{withoutRoutine.length} socios</span> entrenando sin una rutina oficial asignada en la App. 
               </p>
               <button className="w-full bg-[#111111] text-white text-[9px] font-black uppercase tracking-widest py-3 hover:bg-[#d71920] transition-colors">
                  Generar Listado Urgent
               </button>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111] px-2">Asignaciones Staff</h3>
               <div className="bg-white border border-black/10 p-5 space-y-4">
                  {Array.from(new Set(members.map(m => m.trainerName))).filter(Boolean).slice(0,3).map(trainer => (
                    <div key={trainer} className="flex items-center justify-between">
                       <p className="text-[11px] font-bold uppercase text-[#111111]">{trainer}</p>
                       <Badge variant="muted" className="text-[9px]">{members.filter(m => m.trainerName === trainer).length}</Badge>
                    </div>
                  ))}
               </div>
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
}
