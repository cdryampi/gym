import { Activity, AlertCircle, Download, Dumbbell, FileSpreadsheet, Search, ShieldCheck, TrendingUp, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import MembersTable from "@/components/admin/MembersTable";
import { Badge } from "@/components/ui/badge";
import { MembersTableSkeleton } from "@/components/ui/loading-state";
import { NFCard } from "@/components/system/nf-card";
import { listDashboardMembers } from "@/lib/data/gym-management";

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

  const activeMembers = members.filter((member) => member.status === "active");
  const withoutRoutine = members.filter((member) => !member.currentRoutineTitle);

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-black/5 pb-10">
        <DashboardPageHeader
          title="MEMBER SCOUTING"
          description="Gestion operativa de base de socios, planes y asignacion de carga tecnica."
          icon={Activity}
          eyebrow="Operaciones Gym"
          className="pb-0"
        />
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/dashboard/miembros/importar"
            className="bg-white text-[#111111] border border-black/10 px-10 h-14 flex items-center gap-3 font-black uppercase tracking-[0.2em] text-[11px] hover:bg-[#111111] hover:text-white transition-all duration-500 shadow-2xl shadow-black/10 rounded-2xl"
          >
            <FileSpreadsheet className="size-4" />
            Importar
          </Link>
          <Link
            href="/dashboard/miembros/nuevo"
            className="bg-[#111111] text-white px-10 h-14 flex items-center gap-3 font-black uppercase tracking-[0.2em] text-[11px] hover:bg-[#d71920] transition-all duration-500 shadow-2xl shadow-black/10 rounded-2xl"
          >
            <UserPlus className="size-4" />
            Registrar Socio
          </Link>
          <a
            href={`/api/dashboard/members/export${search || status ? `?q=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}` : ""}`}
            className="bg-white text-[#111111] border border-black/10 px-10 h-14 flex items-center gap-3 font-black uppercase tracking-[0.2em] text-[11px] hover:bg-[#111111] hover:text-white transition-all duration-500 shadow-2xl shadow-black/10 rounded-2xl"
          >
            <Download className="size-4" />
            Descargar CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-[1fr_360px]">
        <main className="space-y-12 min-w-0">
          <div className="grid gap-6 md:grid-cols-3">
            <NFCard
              title="Poblacion Total"
              description="Fichas registradas"
              className="bg-white border-black/5 shadow-xl shadow-black/[0.02]"
            >
              <div className="flex items-end justify-between">
                <p className="text-4xl font-black text-[#111111] tracking-tighter">{members.length}</p>
                <div className="size-10 rounded-xl bg-black/5 flex items-center justify-center text-[#7a7f87]">
                  <Users className="size-5" />
                </div>
              </div>
            </NFCard>

            <NFCard
              title="Socios Activos"
              description="Operacion normal"
              status="healthy"
              className="bg-white border-black/5 shadow-xl shadow-black/[0.02]"
            >
              <div className="flex items-end justify-between">
                <p className="text-4xl font-black text-emerald-600 tracking-tighter">
                  {activeMembers.length}
                </p>
                <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="size-5" />
                </div>
              </div>
            </NFCard>

            <NFCard
              title="Sin Rutina"
              description="Requieren atencion"
              status="warning"
              className="bg-white border-black/5 shadow-xl shadow-black/[0.02]"
            >
              <div className="flex items-end justify-between">
                <p className="text-4xl font-black text-amber-600 tracking-tighter">
                  {withoutRoutine.length}
                </p>
                <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Dumbbell className="size-5" />
                </div>
              </div>
            </NFCard>
          </div>

          <section className="space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#111111] tracking-tighter uppercase">
                  Socios Registrados
                </h2>
                <p className="text-xs font-bold text-[#7a7f87] uppercase tracking-tight">
                  Filtra por estado operativo o busca por identificador unico.
                </p>
              </div>
              <div className="h-px flex-1 bg-black/5" />
            </div>

            <div className="space-y-8">
              <form className="grid gap-4 md:grid-cols-[1fr_220px_160px]">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/20 group-focus-within:text-[#d71920] transition-colors" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={search}
                    placeholder="Buscar por nombre, email o ID..."
                    className="flex h-14 w-full border border-black/5 bg-black/[0.02] rounded-2xl pl-12 pr-4 text-sm font-bold text-[#111111] outline-none focus:bg-white focus:ring-1 focus:ring-[#111111]/5 focus:border-black/20 transition-all placeholder:text-[#7a7f87]/40"
                  />
                </div>
                <div className="relative">
                  <select
                    name="status"
                    defaultValue={status}
                    className="flex h-14 w-full border border-black/5 bg-black/[0.02] rounded-2xl px-6 text-xs font-black uppercase outline-none focus:bg-white focus:ring-1 focus:ring-[#111111]/5 transition-all appearance-none text-[#111111]"
                  >
                    <option value="">Todos los estados</option>
                    <option value="active">Active</option>
                    <option value="prospect">Prospect</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="former">Ex-socio</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M1 1L5 5L9 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <button
                  type="submit"
                  className="h-14 bg-[#111111] text-white rounded-2xl px-8 text-[11px] font-black uppercase tracking-widest hover:bg-[#d71920] transition-all shadow-lg shadow-black/10 active:scale-95"
                >
                  Filtrar
                </button>
              </form>

              <Suspense key={search + status} fallback={<MembersTableSkeleton />}>
                <MembersTable initialMembers={members} />
              </Suspense>
            </div>
          </section>
        </main>

        <aside className="space-y-8">
          <div className="sticky top-24 space-y-10">
            <div className="bg-[#111111] p-8 text-white rounded-[2.5rem] shadow-2xl shadow-black/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-[#d71920]/20 transition-all duration-700" />

              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="size-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <TrendingUp className="size-4 text-[#d71920]" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                  Insights
                </p>
              </div>

              <div className="space-y-8 relative z-10">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                    <span className="text-white/60">Rutina Vigente</span>
                    <span className="text-[#d71920] font-black text-xs">
                      {Math.round(((members.length - withoutRoutine.length) / (members.length || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 overflow-hidden rounded-full border border-white/5">
                    <div
                      className="h-full bg-[#d71920] rounded-full shadow-[0_0_10px_rgba(215,25,32,0.5)]"
                      style={{
                        width: `${((members.length - withoutRoutine.length) / (members.length || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                    <span className="text-white/60">Tasa Retencion</span>
                    <span className="text-emerald-500 font-black text-xs">92%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 overflow-hidden rounded-full border border-white/5">
                    <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] w-[92%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50/50 border border-red-100 p-8 rounded-[2rem] space-y-6 relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 size-24 bg-red-100/50 rounded-full blur-2xl" />

              <div className="flex items-center gap-3 relative z-10">
                <div className="size-8 rounded-xl bg-[#d71920] flex items-center justify-center shadow-lg shadow-red-500/20">
                  <AlertCircle className="size-4 text-white" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#d71920]">
                  Alerta Operativa
                </p>
              </div>

              <p className="text-[13px] font-bold text-[#111111] leading-relaxed relative z-10">
                Hay{" "}
                <span className="text-[#d71920] font-black underline underline-offset-4 decoration-2">
                  {withoutRoutine.length} socios
                </span>{" "}
                sin rutina asignada.
              </p>

              <button
                type="button"
                disabled
                title="Accion pendiente de automatizacion."
                className="w-full bg-[#111111] text-white text-[10px] font-black uppercase tracking-[0.15em] h-12 rounded-xl hover:bg-[#d71920] transition-all shadow-xl shadow-black/5 relative z-10"
              >
                Listado No Disponible
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111]">
                  Staff
                </h3>
                <div className="h-px flex-1 bg-black/5" />
              </div>

              <div className="bg-white border border-black/5 p-6 rounded-[2rem] shadow-sm space-y-5">
                {Array.from(new Set(members.map((member) => member.trainerName)))
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((trainer) => (
                    <div
                      key={trainer}
                      className="flex items-center justify-between group hover:translate-x-1 transition-transform duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-black text-[#111111]/40 border border-black/5 group-hover:bg-[#111111] group-hover:text-white transition-all">
                          {trainer ? trainer[0].toUpperCase() : "?"}
                        </div>
                        <p className="text-[11px] font-black uppercase text-[#111111] tracking-tight">
                          {trainer}
                        </p>
                      </div>
                      <Badge variant="muted" className="text-[9px] font-black bg-black/5 border-none px-3 py-1 rounded-lg">
                        {members.filter((member) => member.trainerName === trainer).length}
                      </Badge>
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
