"use client";

import { useOptimistic, useMemo, useState, useTransition } from "react";
import {
  Activity,
  Check,
  Dumbbell,
  Eye,
  MapPin,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { deleteMemberAction } from "@/app/(admin)/dashboard/miembros/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirmDialog } from "@/features/admin/components/shared/delete-confirm-dialog";
import type { DashboardMemberListItem } from "@/lib/data/gym-management";
import { cn } from "@/lib/utils";

interface MembersTableProps {
  initialMembers: DashboardMemberListItem[];
}

type GenderFilter = "all" | "M" | "F";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:bg-emerald-100",
  expired: "bg-red-50 text-red-700 border-red-100 group-hover:bg-red-100",
  frozen: "bg-sky-50 text-sky-700 border-sky-100 group-hover:bg-sky-100",
};

const statusDotStyles: Record<string, string> = {
  active: "bg-emerald-500 animate-pulse",
  expired: "bg-red-500",
  frozen: "bg-sky-500",
};

function matchesSearch(member: DashboardMemberListItem, normalizedSearch: string) {
  if (!normalizedSearch) {
    return true;
  }

  return [member.fullName, member.email, member.memberNumber, member.externalCode].some((value) =>
    value?.toLowerCase().includes(normalizedSearch),
  );
}

function GenderBadge({ gender }: { gender: DashboardMemberListItem["gender"] }) {
  if (!gender) {
    return (
      <span className="inline-flex h-6 w-8 items-center justify-center rounded-md border border-black/5 bg-black/[0.03] text-[9px] font-black text-[#7a7f87]">
        --
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 w-8 items-center justify-center rounded-md border text-[10px] font-black uppercase tracking-widest",
        gender === "F"
          ? "border-pink-100 bg-pink-50 text-pink-700"
          : "border-sky-100 bg-sky-50 text-sky-700",
      )}
    >
      {gender}
    </span>
  );
}

function ProfileCompletedIcon({ completed }: { completed: boolean }) {
  return (
    <span
      aria-label={completed ? "Perfil completo" : "Perfil incompleto"}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-full border",
        completed
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-red-100 bg-red-50 text-red-700",
      )}
    >
      {completed ? <Check className="size-3.5" /> : <X className="size-3.5" />}
    </span>
  );
}

export default function MembersTable({ initialMembers }: MembersTableProps) {
  const [, startTransition] = useTransition();
  const [memberToDelete, setMemberToDelete] = useState<DashboardMemberListItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [districtSearch, setDistrictSearch] = useState("");
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);

  const [optimisticMembers, deleteOptimisticMember] = useOptimistic(
    initialMembers,
    (state, idToRemove: string) => state.filter((member) => member.id !== idToRemove),
  );

  const filteredMembers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedDistrict = districtSearch.trim().toLowerCase();

    return optimisticMembers.filter((member) => {
      const district = member.districtOrUrbanization?.toLowerCase() ?? "";

      return (
        matchesSearch(member, normalizedSearch) &&
        (genderFilter === "all" || member.gender === genderFilter) &&
        (!normalizedDistrict || district.includes(normalizedDistrict)) &&
        (!showCompletedOnly || member.profileCompleted)
      );
    });
  }, [districtSearch, genderFilter, optimisticMembers, searchTerm, showCompletedOnly]);

  function handleDeleteConfirm() {
    if (!memberToDelete) {
      return;
    }

    const id = memberToDelete.id;
    setMemberToDelete(null);

    startTransition(async () => {
      try {
        const result = await deleteMemberAction(id);

        if (!result?.success) {
          toast.error(result?.error ?? "Error al eliminar la ficha del socio.");
          return;
        }

        deleteOptimisticMember(id);
        toast.success("Socio eliminado. Usuario Firebase liberado si no era cuenta protegida.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error al eliminar la ficha del socio.",
        );
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-black/5 shadow-2xl shadow-black/[0.03] bg-white">
      <DeleteConfirmDialog
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar ficha operativa"
        description={`Esta accion eliminara la ficha de ${memberToDelete?.fullName || ""} y, si tiene usuario vinculado no protegido, tambien eliminara el usuario de Firebase para poder crearlo de nuevo.`}
      />

      <div className="grid gap-3 border-b border-black/5 bg-black/[0.015] p-4 sm:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#7a7f87]" />
          <span className="sr-only">Buscar socios</span>
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nombre, email, expediente o codigo externo..."
            className="h-10 rounded-xl border-black/5 bg-white pl-9 text-[11px] font-bold shadow-sm placeholder:text-[10px] placeholder:uppercase placeholder:tracking-tight"
          />
        </label>
        <label className="relative block">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#7a7f87]" />
          <span className="sr-only">Buscar distrito</span>
          <Input
            value={districtSearch}
            onChange={(event) => setDistrictSearch(event.target.value)}
            placeholder="Distrito / urb."
            className="h-10 rounded-xl border-black/5 bg-white pl-9 text-[11px] font-bold shadow-sm placeholder:text-[10px] placeholder:uppercase placeholder:tracking-tight"
          />
        </label>
        <Select
          value={genderFilter}
          onValueChange={(value) => setGenderFilter(value as GenderFilter)}
        >
          <SelectTrigger
            aria-label="Filtrar por genero"
            className="h-10 rounded-xl border-black/5 bg-white text-[10px] font-black uppercase tracking-widest shadow-sm"
          >
            <SelectValue placeholder="Genero" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="M">Masculino</SelectItem>
            <SelectItem value="F">Femenino</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex h-10 items-center justify-between gap-3 rounded-xl border border-black/5 bg-white px-3 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#111111]">
            Perfil completo
          </span>
          <Switch
            checked={showCompletedOnly}
            onCheckedChange={setShowCompletedOnly}
            aria-label="Mostrar solo perfiles completos"
          />
        </label>
      </div>

      <Table className="min-w-[1180px]">
        <TableHeader className="bg-black/[0.02]">
          <TableRow className="hover:bg-transparent border-black/5">
            <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-[#111111] px-6">
              <div className="flex items-center gap-2">
                <Users className="size-3 text-[#d71920]" />
                <span>Socio / Expediente</span>
              </div>
            </TableHead>
            <TableHead className="h-14 w-[104px] font-black text-[10px] uppercase tracking-widest text-[#111111]">
              <span>Codigo</span>
            </TableHead>
            <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-[#111111]">
              <div className="flex items-center gap-2">
                <MapPin className="size-3 text-[#d71920]" />
                <span>Distrito / Urb.</span>
              </div>
            </TableHead>
            <TableHead className="h-14 w-[76px] font-black text-[10px] uppercase tracking-widest text-[#111111]">
              <div className="flex items-center gap-2">
                <UserRound className="size-3 text-[#d71920]" />
                <span>Gen.</span>
              </div>
            </TableHead>
            <TableHead className="h-14 w-[92px] font-black text-[10px] uppercase tracking-widest text-[#111111]">
              <span>Completo</span>
            </TableHead>
            <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-[#111111]">
              <div className="flex items-center gap-2">
                <Activity className="size-3 text-[#d71920]" />
                <span>Estado Operativo</span>
              </div>
            </TableHead>
            <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-[#111111]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-3 text-[#d71920]" />
                <span>Perfil Interno</span>
              </div>
            </TableHead>
            <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-[#111111]">
              <div className="flex items-center gap-2">
                <Dumbbell className="size-3 text-[#d71920]" />
                <span>Carga Tecnica</span>
              </div>
            </TableHead>
            <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-[#111111] text-right px-6">
              <span>Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMembers.map((member) => (
            <TableRow
              key={member.id}
              className="group hover:bg-black/[0.01] transition-all duration-300 border-black/[0.03]"
            >
              <TableCell className="px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="size-11 shrink-0 rounded-2xl border border-black/5 bg-[#111111] flex items-center justify-center font-black text-white text-xs shadow-lg shadow-black/10 group-hover:scale-105 transition-transform duration-500">
                    {member.fullName[0].toUpperCase()}
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/miembros/${member.id}`}
                      className="text-[13px] font-black text-[#111111] hover:text-[#d71920] transition-colors uppercase tracking-tight block mb-1"
                    >
                      {member.fullName}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-[#d71920] bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        {member.memberNumber}
                      </span>
                      <span className="text-black/10 text-[10px]">-</span>
                      <p className="text-[10px] font-bold text-[#7a7f87] lowercase opacity-60">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-5 align-middle">
                <span className="inline-flex max-w-[92px] truncate rounded-md border border-black/5 bg-black/[0.03] px-2 py-1 font-mono text-[10px] font-black uppercase tracking-tight text-[#111111]">
                  {member.externalCode || "--"}
                </span>
              </TableCell>
              <TableCell className="py-5 align-middle">
                <span className="block max-w-[160px] truncate text-[10px] font-bold uppercase tracking-tight text-[#7a7f87]">
                  {member.districtOrUrbanization || "SIN DISTRITO"}
                </span>
              </TableCell>
              <TableCell className="py-5 align-middle">
                <GenderBadge gender={member.gender} />
              </TableCell>
              <TableCell className="py-5 align-middle">
                <ProfileCompletedIcon completed={member.profileCompleted} />
              </TableCell>
              <TableCell className="py-5">
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-500",
                    statusStyles[member.status] ??
                      "bg-black/[0.03] text-[#7a7f87] border-black/5 group-hover:bg-black/[0.06]",
                  )}
                >
                  <div
                    className={cn(
                      "size-1 rounded-full",
                      statusDotStyles[member.status] ?? "bg-[#7a7f87]",
                    )}
                  />
                  {member.status}
                </div>
              </TableCell>
              <TableCell className="py-5">
                <span className="inline-flex px-2.5 py-1 bg-black/[0.03] border border-black/5 text-[9px] font-black uppercase tracking-[0.2em] text-[#7a7f87] rounded-md transition-colors group-hover:bg-white group-hover:border-black/10">
                  {member.planLabel || "SIN PLAN"}
                </span>
              </TableCell>
              <TableCell className="py-5">
                <div
                  className={cn(
                    "flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight transition-colors",
                    member.currentRoutineTitle ? "text-emerald-600" : "text-amber-600 animate-pulse",
                  )}
                >
                  <div
                    className={cn(
                      "size-1.5 rounded-full",
                      member.currentRoutineTitle ? "bg-emerald-500" : "bg-amber-500",
                    )}
                  />
                  {member.currentRoutineTitle ?? "SIN ASIGNAR"}
                </div>
              </TableCell>
              <TableCell className="text-right px-6 py-5">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/miembros/${member.id}`}
                    className="inline-flex h-10 items-center rounded-xl border border-black/10 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-[#111111] transition-all duration-500 hover:bg-[#111111] hover:text-white hover:border-[#111111] hover:shadow-xl hover:shadow-black/10 active:scale-95"
                  >
                    <Eye className="size-3.5 mr-2" />
                    Ver Ficha
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar socio ${member.fullName}`}
                    onClick={() => setMemberToDelete(member)}
                    className="h-10 w-10 text-[#7a7f87] hover:text-[#d71920] hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
