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
import { listDashboardRoutineTemplates } from "@/lib/data/gym-management";
import { cn } from "@/lib/utils";
import { LayoutTemplate, Plus, Users } from "lucide-react";

export default async function DashboardRoutinesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const search = params.q ?? "";
  const templates = await listDashboardRoutineTemplates(search || undefined);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Rutinas"
        description="Plantillas editables con bloques y ejercicios, listas para asignarse desde dashboard o mobile staff."
        icon={LayoutTemplate}
        eyebrow="Backoffice gym"
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminMetricCard
          label="Plantillas"
          value={String(templates.length)}
          hint="Plantillas creadas en Supabase."
          icon={LayoutTemplate}
        />
        <AdminMetricCard
          label="Activas"
          value={String(templates.filter((template) => template.isActive).length)}
          hint="Disponibles para asignacion."
          icon={LayoutTemplate}
          tone="success"
        />
        <AdminMetricCard
          label="Asignaciones"
          value={String(templates.reduce((total, template) => total + template.assignedMembers, 0))}
          hint="Relaciones plantilla-miembro registradas."
          icon={Users}
          tone="warning"
        />
      </div>

      <AdminSection
        title="Plantillas operativas"
        description="Busca por nombre, objetivo o dificultad y entra a editar la estructura completa."
        badge={
          <Link
            href="/dashboard/rutinas/nueva"
            className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-[#d71920] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#d71920]/90"
          >
            <Plus className="h-4 w-4" />
            Nueva rutina
          </Link>
        }
      >
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-black/5 pb-4">
            {["Todas", "Principiante", "Media", "Avanzada", "Elite"].map((diff) => (
              <button
                key={diff}
                className={cn(
                  "rounded-none border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                  diff === "Todas"
                    ? "border-[#d71920]/20 bg-[#fff3f3] text-[#111111]"
                    : "border-black/5 bg-white text-[#7a7f87] hover:border-black/10 hover:text-[#111111]"
                )}
              >
                {diff}
              </button>
            ))}
          </div>

          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Buscar por titulo, objetivo o resumen..."
                className="flex h-12 w-full border border-black/10 bg-[#fbfbf8] px-4 py-2 text-sm text-[#111111] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d71920]/10"
              />
            </div>
            <button
              type="submit"
              className="h-12 border border-black/10 bg-white px-8 text-sm font-bold uppercase tracking-wider text-[#111111] transition-all hover:bg-black/5"
            >
              Filtrar
            </button>
          </form>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-black/5 hover:bg-black/5">
              <TableHead className="font-bold text-[#111111]">Plantilla</TableHead>
              <TableHead className="font-bold text-[#111111]">Objetivo / Dificultad</TableHead>
              <TableHead className="font-bold text-[#111111]">Coach</TableHead>
              <TableHead className="font-bold text-[#111111]">Estructura</TableHead>
              <TableHead className="font-bold text-[#111111] text-center">Asig.</TableHead>
              <TableHead className="font-bold text-[#111111]">Estado</TableHead>
              <TableHead className="font-bold text-[#111111]">Accion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id} className="group transition-colors hover:bg-[#fbfbf8]">
                <TableCell>
                  <div className="max-w-[300px]">
                    <Link
                      href={`/dashboard/rutinas/${template.id}`}
                      className="text-base font-bold text-[#111111] hover:text-[#d71920] transition-colors"
                    >
                      {template.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7a7f87]">
                      {template.summary}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#d71920]" />
                      <span className="text-xs font-bold uppercase tracking-wide text-[#111111]">{template.goal}</span>
                    </div>
                    <Badge variant="muted" className="text-[10px] uppercase tracking-wider font-bold bg-black/5">
                      {template.difficultyLabel}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-bold">
                      {template.trainerName ? template.trainerName[0] : "C"}
                    </div>
                    <span className="text-sm font-medium text-[#111111]">
                      {template.trainerName ?? "Club Default"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-[#111111]">{template.blockCount} bloques</p>
                    <p className="text-[#7a7f87]">{template.exerciseCount} ejercicios</p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-sm font-bold text-[#111111]">
                    {template.assignedMembers}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={template.isActive ? "success" : "muted"} className="uppercase tracking-wider text-[9px] font-black">
                    {template.isActive ? "activa" : "inactiva"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/rutinas/${template.id}`}
                    className="inline-flex h-10 items-center border border-black/10 bg-white px-4 text-xs font-bold uppercase tracking-wider text-[#111111] transition-all hover:border-[#d71920]/20 hover:bg-[#fff3f3] hover:text-[#d71920]"
                  >
                    Editar
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminSection>
    </div>
  );
}
