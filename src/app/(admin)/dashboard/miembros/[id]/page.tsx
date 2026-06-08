import { notFound } from "next/navigation";
import { Activity, Calendar, CreditCard, Mail, MapPin, User, FileText, Info, Clock } from "lucide-react";

import AdminSurface from "@/components/admin/AdminSurface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getDashboardMemberDetail,
  listDashboardAuthLinkOptions,
  listDashboardTrainerOptions,
} from "@/lib/data/gym-management";
import { listMembershipPlans } from "@/lib/data/memberships";
import { listMemberCheckins } from "@/lib/data/member-checkins";
import { cn } from "@/lib/utils";
import { MemberNotesPanel } from "@/features/admin/members/components/MemberNotesPanel";

import DeleteMemberButton from "./components/DeleteMemberButton";
import MemberFinanceTab from "./components/MemberFinanceTab";
import MemberProfileTab from "./components/MemberProfileTab";
import MemberProgressTab from "./components/MemberProgressTab";
import MemberTrainingTab from "./components/MemberTrainingTab";
import GrantMemberWebAccessButton from "./components/GrantMemberWebAccessButton";
import SendMemberPasswordResetButton from "./components/SendMemberPasswordResetButton";

export default async function DashboardMemberDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const [detail, authOptions, trainerOptions, membershipPlans, recentCheckins] = await Promise.all([
    getDashboardMemberDetail(id),
    listDashboardAuthLinkOptions(),
    listDashboardTrainerOptions(),
    listMembershipPlans({ activeOnly: false }),
    listMemberCheckins(id, 10),
  ]);

  if (!detail) {
    notFound();
  }

  const member = detail.member;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 border-b border-black/5 -mx-8 -mt-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="size-20 rounded-2xl bg-[#111111] flex items-center justify-center shadow-2xl shadow-black/20">
            <User className="size-10 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d71920] bg-red-50 px-2 py-0.5 rounded">
                Socio {member.memberNumber}
              </span>
              {member.externalCode && (
                <Badge variant="muted" className="text-[9px] font-bold border-black/10 text-[#7a7f87]">
                  LEGACY: {member.externalCode}
                </Badge>
              )}
              <Badge variant="muted" className="text-[9px] font-bold border-black/10">
                ID: {member.id.split("-")[0].toUpperCase()}
              </Badge>
            </div>
            <h1 className="text-4xl font-black text-[#111111] tracking-tighter uppercase leading-none">
              {member.fullName}
            </h1>
            <p className="text-sm font-bold text-[#7a7f87] mt-2 flex items-center gap-2">
              <Mail className="size-3.5" /> {member.email}
              <span className="opacity-20">|</span>
              <MapPin className="size-3.5" /> {member.branchName ?? "Sede Central"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {member.linkedUserId ? (
            <SendMemberPasswordResetButton memberId={id} />
          ) : (
            <GrantMemberWebAccessButton memberId={id} />
          )}
          <DeleteMemberButton memberId={id} memberName={member.fullName} />
          <Button
            disabled
            title="Acciones rapidas (enviar email, generar QR, etc.) en desarrollo."
            className="h-12 px-8 bg-[#d71920] hover:bg-[#b0141a] text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20 transition-all opacity-60 cursor-not-allowed"
          >
            Acciones en Desarrollo
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <AdminSurface
              className={cn(
                "p-6 border-none shadow-sm transition-all duration-300 relative overflow-hidden",
                member.status === "active"
                  ? "bg-emerald-600 text-white shadow-emerald-500/20"
                  : "bg-[#111111] text-white",
              )}
            >
              <div className="relative z-10">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-80 mb-4">
                  Estado Membresia
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tighter">
                    {member.status.toUpperCase()}
                  </span>
                </div>
                <p className="mt-4 text-[11px] font-medium text-white/90 leading-relaxed max-w-[200px]">
                  {detail.statusMeta.helperText}
                </p>
              </div>
              <Activity className="absolute -right-4 -bottom-4 size-32 opacity-10 -rotate-12" />
            </AdminSurface>

            <AdminSurface
              className={cn(
                "p-6 border-none shadow-sm transition-all duration-300 bg-white relative overflow-hidden",
                (detail.financials?.balanceDue ?? 0) > 0 ? "ring-2 ring-red-500/20" : "",
              )}
            >
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#7a7f87] mb-4">
                Deuda Pendiente
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-[14px] font-black text-[#7a7f87]">S/</span>
                <span
                  className={cn(
                    "text-4xl font-black tracking-tighter",
                    (detail.financials?.balanceDue ?? 0) > 0 ? "text-[#d71920]" : "text-[#111111]",
                  )}
                >
                  {detail.financials?.balanceDue.toFixed(2) ?? "0.00"}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    (detail.financials?.balanceDue ?? 0) > 0 ? "bg-[#d71920] animate-pulse" : "bg-emerald-500",
                  )}
                />
                <p
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    (detail.financials?.balanceDue ?? 0) > 0 ? "text-[#d71920]" : "text-emerald-600",
                  )}
                >
                  {(detail.financials?.balanceDue ?? 0) > 0 ? "Pago Requerido" : "Cuenta al dia"}
                </p>
              </div>
              <CreditCard className="absolute -right-4 -bottom-4 size-32 opacity-5 -rotate-12 text-black" />
            </AdminSurface>

            <AdminSurface className="p-6 border-none shadow-sm bg-white relative overflow-hidden">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#7a7f87] mb-4">
                Vencimiento
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#111111] tracking-tighter uppercase">
                  {detail.financials?.endDate
                    ? new Date(detail.financials.endDate).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                      })
                    : "---"}
                </span>
                <span className="text-[10px] font-bold text-[#7a7f87] uppercase">
                  {detail.financials?.endDate
                    ? new Date(detail.financials.endDate).getFullYear()
                    : ""}
                </span>
              </div>
              <p className="mt-4 text-[11px] font-bold text-[#5f6368] uppercase flex items-center gap-1.5">
                Proxima renovacion sugerida
              </p>
              <Calendar className="absolute -right-4 -bottom-4 size-32 opacity-5 -rotate-12 text-black" />
            </AdminSurface>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AdminSurface className="p-8 border-black/5 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="size-4 text-[#d71920]" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111111]">
                  Datos Legacy (Lectura)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#7a7f87] mb-1">F. Nacimiento</p>
                  <p className="text-sm font-bold text-[#111111]">{member.birthDate ? new Date(member.birthDate).toLocaleDateString("es-PE") : "---"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#7a7f87] mb-1">Género</p>
                  <p className="text-sm font-bold text-[#111111]">{member.gender ?? "---"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#7a7f87] mb-1">Dirección</p>
                  <p className="text-sm font-bold text-[#111111] leading-tight">
                    {[member.address, member.districtOrUrbanization].filter(Boolean).join(", ") || "---"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#7a7f87] mb-1">Ocupación</p>
                  <p className="text-sm font-bold text-[#111111]">{member.occupation ?? "---"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#7a7f87] mb-1">Horario Preferido</p>
                  <p className="text-sm font-bold text-[#111111]">{member.preferredSchedule ?? "---"}</p>
                </div>
                {member.legacyNotes && (
                  <div className="col-span-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#7a7f87] mb-1">Notas Legacy</p>
                    <p className="text-[12px] font-medium text-[#5f6368] leading-relaxed italic bg-black/[0.02] p-3 border-l-2 border-black/5">
                      {member.legacyNotes}
                    </p>
                  </div>
                )}
              </div>
            </AdminSurface>

            <AdminSurface className="p-8 border-black/5 bg-white shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="size-4 text-emerald-600" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111111]">
                  Membresia Activa
                </h3>
              </div>
              {detail.financials ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#7a7f87] mb-1">Plan Actual</p>
                    <p className="text-xl font-black text-[#111111] tracking-tight uppercase">{detail.financials.planTitle}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#7a7f87] mb-1">Inicia</p>
                      <p className="text-sm font-bold text-[#111111]">
                        {detail.financials.startDate ? new Date(detail.financials.startDate).toLocaleDateString("es-PE") : "---"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#7a7f87] mb-1">Vence</p>
                      <p className="text-sm font-bold text-[#111111]">
                        {detail.financials.endDate ? new Date(detail.financials.endDate).toLocaleDateString("es-PE") : "---"}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-black/5">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#7a7f87]">Saldo Pendiente</p>
                      <p className={cn(
                        "text-lg font-black tracking-tight",
                        detail.financials.balanceDue > 0 ? "text-[#d71920]" : "text-emerald-600"
                      )}>
                        S/ {detail.financials.balanceDue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Info className="size-8 text-black/10 mb-2" />
                  <p className="text-xs font-bold text-[#7a7f87] uppercase tracking-wider">Sin membresia vinculada</p>
                </div>
              )}
            </AdminSurface>
          </div>

          <Tabs defaultValue="perfil" className="w-full">
            <div className="flex items-center justify-between mb-8 border-b border-black/5">
              <TabsList className="bg-transparent p-0 h-auto gap-12">
                <TabsTrigger
                  value="perfil"
                  className="data-[state=active]:text-[#d71920] data-[state=active]:border-[#d71920] border-b-4 border-transparent rounded-none px-0 pb-4 font-black uppercase text-[11px] tracking-[0.2em] transition-all bg-transparent shadow-none shadow-transparent"
                >
                  Perfil
                </TabsTrigger>
                <TabsTrigger
                  value="finanzas"
                  className="data-[state=active]:text-[#d71920] data-[state=active]:border-[#d71920] border-b-4 border-transparent rounded-none px-0 pb-4 font-black uppercase text-[11px] tracking-[0.2em] transition-all bg-transparent shadow-none shadow-transparent"
                >
                  Finanzas
                </TabsTrigger>
                <TabsTrigger
                  value="progreso"
                  className="data-[state=active]:text-[#d71920] data-[state=active]:border-[#d71920] border-b-4 border-transparent rounded-none px-0 pb-4 font-black uppercase text-[11px] tracking-[0.2em] transition-all bg-transparent shadow-none shadow-transparent"
                >
                  Progreso
                </TabsTrigger>
                <TabsTrigger
                  value="entrenamiento"
                  className="data-[state=active]:text-[#d71920] data-[state=active]:border-[#d71920] border-b-4 border-transparent rounded-none px-0 pb-4 font-black uppercase text-[11px] tracking-[0.2em] transition-all bg-transparent shadow-none shadow-transparent"
                >
                  Entrenamiento
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="perfil" className="outline-none focus:ring-0">
              <MemberProfileTab detail={detail} authOptions={authOptions} trainerOptions={trainerOptions} />
            </TabsContent>

            <TabsContent value="finanzas" className="outline-none focus:ring-0">
              <MemberFinanceTab
                financials={detail.financials}
                memberId={id}
                memberEmail={member.email}
                memberName={member.fullName}
                memberPhone={member.phone}
                membershipPlans={membershipPlans}
              />
            </TabsContent>

            <TabsContent value="progreso" className="outline-none focus:ring-0">
              <MemberProgressTab measurements={detail.measurements} memberId={id} />
            </TabsContent>

            <TabsContent value="entrenamiento" className="outline-none focus:ring-0">
              <MemberTrainingTab
                detail={member}
                assignmentHistory={detail.assignmentHistory}
                availableTemplates={detail.availableTemplates}
                trainingFeedback={detail.trainingFeedback}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <AdminSurface className="p-6 border-black/5 bg-white shadow-sm h-fit">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111111]">
                Observaciones
              </h3>
              <Badge variant="muted" className="text-[9px] font-bold">Privado</Badge>
            </div>
            <MemberNotesPanel memberId={id} />
          </AdminSurface>

          <AdminSurface className="p-6 border-black/5 bg-white shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-[#d71920]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111111]">
                Ultimas asistencias
              </h3>
            </div>
            {recentCheckins.length === 0 ? (
              <p className="text-xs font-bold text-[#7a7f87] text-center py-4">
                Aun no hay registros de asistencia para este socio.
              </p>
            ) : (
              <div className="space-y-2">
                {recentCheckins.map((checkin) => (
                  <div
                    key={checkin.id}
                    className="flex items-center justify-between border border-black/5 p-2.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#111111]">
                        {new Date(checkin.checked_in_at).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        ·{" "}
                        {new Date(checkin.checked_in_at).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-[10px] text-[#7a7f87] uppercase font-medium">
                        {checkin.method === "qr" ? "QR" : checkin.method === "reception" ? "Recepcion" : "Manual"}
                        {checkin.registered_by_email ? ` · ${checkin.registered_by_email}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant={
                        checkin.status_snapshot === "active"
                          ? "success"
                          : checkin.status_snapshot === "expires_today"
                            ? "warning"
                            : ["expired", "cancelled", "former"].includes(checkin.status_snapshot)
                              ? "default"
                              : "muted"
                      }
                      className="text-[9px]"
                    >
                      {checkin.status_snapshot.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </AdminSurface>
        </div>
      </div>
    </div>
  );
}
