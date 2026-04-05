"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { UserCheck, ShieldCheck, ClipboardList, Info, Lock } from "lucide-react";

import { saveMemberProfileAction } from "@/app/(admin)/dashboard/miembros/actions";
import type {
  AuthLinkOption,
  DashboardMemberDetail,
  TrainerOption,
} from "@/lib/data/gym-management";
import { memberFormSchema, type MemberFormValues } from "@/lib/validators/gym-members";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function toFormValues(detail?: DashboardMemberDetail | null): MemberFormValues {
  return {
    linkedUserId: detail?.member.linkedUserId ?? null,
    trainerUserId: detail?.member.trainerUserId ?? null,
    fullName: detail?.member.fullName ?? "",
    email: detail?.member.email ?? "",
    phone: detail?.member.phone ?? null,
    status: detail?.member.status ?? "prospect",
    branchName: detail?.member.branchName ?? null,
    notes: detail?.notes ?? null,
    joinDate: detail?.member.joinDate ?? new Date().toISOString().slice(0, 10),
    planLabel: detail?.plan?.label ?? "",
    planStatus: detail?.plan?.status ?? "active",
    planStartedAt: detail?.plan?.startedAt ?? null,
    planEndsAt: detail?.plan?.endsAt ?? null,
    planNotes: detail?.plan?.notes ?? null,
  };
}

interface MemberProfileFormProps {
  authOptions: AuthLinkOption[];
  detail?: DashboardMemberDetail | null;
  trainerOptions: TrainerOption[];
}

export default function MemberProfileForm({
  authOptions,
  detail,
  trainerOptions,
}: Readonly<MemberProfileFormProps>) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: toFormValues(detail),
  });

  const linkedUser = authOptions.find(o => o.id === form.getValues("linkedUserId"));

  function onSubmit(values: MemberFormValues) {
    setFeedback(null);
    startTransition(async () => {
      try {
        await saveMemberProfileAction(values, detail?.member.id);
        setFeedback(detail ? "Ficha actualizada con exito." : "Miembro registrado correctamente.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Error al procesar la ficha.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        
        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_360px]">
          
          {/* COLUMNA PRINCIPAL: DATOS DE IDENTIDAD Y PLAN */}
          <div className="space-y-10">
            
            {/* SECCION 1: IDENTIDAD */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                 <UserCheck className="h-5 w-5 text-[#d71920]" />
                 <h3 className="font-display text-xl font-black uppercase tracking-tighter text-[#111111]">Identidad del Socio</h3>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Nombre Completo</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-12 font-bold text-lg border-black/10 focus:ring-1 focus:ring-[#d71920]/20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Email Corporativo / Personal</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} className="h-12 font-medium border-black/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Telefono de Contacto</FormLabel>
                      <FormControl>
                        <Input
                          value={typeof field.value === "string" ? field.value : ""}
                          onChange={(event) => field.onChange(event.target.value || null)}
                          className="h-11 border-black/10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="joinDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Fecha de Alta</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-11 border-black/10 font-bold uppercase text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="branchName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Sede Principal</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej. Club Central"
                          value={typeof field.value === "string" ? field.value : ""}
                          onChange={(event) => field.onChange(event.target.value || null)}
                          className="h-11 border-black/10 font-bold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECCION 2: PLAN Y CONTRATO */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                 <ClipboardList className="h-5 w-5 text-[#d71920]" />
                 <h3 className="font-display text-xl font-black uppercase tracking-tighter text-[#111111]">Estructura de Plan</h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <FormField
                  control={form.control}
                  name="planLabel"
                  render={({ field }) => (
                    <FormItem className="xl:col-span-2">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Denominacion del Plan</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-11 font-black uppercase border-black/10 bg-[#fbfbf8]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="planStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Vigencia Contrato</FormLabel>
                      <FormControl>
                        <select
                          value={typeof field.value === "string" ? field.value : "active"}
                          onChange={(event) => field.onChange(event.target.value)}
                          className="flex h-11 w-full border border-black/10 bg-white px-3 text-xs font-black uppercase text-[#111111] outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="expired">Expired</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Estado Operativo</FormLabel>
                      <FormControl>
                        <select
                          value={typeof field.value === "string" ? field.value : "prospect"}
                          onChange={(event) => field.onChange(event.target.value)}
                          className="flex h-11 w-full border border-black/10 bg-white px-3 text-xs font-black uppercase text-[#111111] outline-none"
                        >
                          <option value="prospect">Prospect</option>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="former">Former</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="planStartedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Fecha Inicio Ciclo</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={typeof field.value === "string" ? field.value : ""}
                          onChange={(event) => field.onChange(event.target.value || null)}
                          className="h-11 border-black/10 text-xs font-bold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECCION 3: NOTAS OPERATIVAS */}
            <div className="space-y-6">
               <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Bitacora Interna (Solo Admin)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Observaciones sobre comportamiento, lesiones o historial comercial..."
                        className="rounded-none border-black/10 bg-[#fbfbf8] text-sm"
                        value={typeof field.value === "string" ? field.value : ""}
                        onChange={(event) => field.onChange(event.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* COLUMNA LATERAL: VINCULACIONES Y SEGURIDAD */}
          <aside className="space-y-8">
            <div className="sticky top-24 space-y-8">
              
              {/* VINCULACION AUTH (PROTEGIDA) */}
              <div className="bg-[#111111] p-6 text-white shadow-xl">
                 <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="h-4 w-4 text-[#d71920]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Seguridad App</p>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="bg-white/5 p-4 border border-white/10">
                       <p className="text-[9px] font-black uppercase text-white/40 mb-2">Usuario Auth Vinculado</p>
                       {linkedUser ? (
                         <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-white">{linkedUser.displayName}</p>
                            <p className="text-[10px] font-medium text-white/60 truncate">{linkedUser.email}</p>
                         </div>
                       ) : (
                         <p className="text-[10px] font-bold text-[#d71920] uppercase tracking-tighter">Sin Vinculo Digital</p>
                       )}
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20">
                       <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                       <p className="text-[9px] leading-relaxed text-amber-200/80 font-medium">
                         La vinculacion de identidad esta bloqueada desde este panel por seguridad.
                       </p>
                    </div>
                    
                    {/* Input oculto/deshabilitado para el formulario */}
                    <input type="hidden" {...form.register("linkedUserId")} />
                 </div>
              </div>

              {/* ASIGNACION STAFF */}
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#111111] px-2">Responsable Tecnico</h3>
                 <div className="bg-white border border-black/10 p-6 shadow-sm">
                    <FormField
                      control={form.control}
                      name="trainerUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase text-[#7a7f87]">Coach Asignado</FormLabel>
                          <FormControl>
                            <select
                              value={typeof field.value === "string" ? field.value : ""}
                              onChange={(event) => field.onChange(event.target.value || null)}
                              className="flex h-10 w-full border border-black/10 bg-white px-3 text-[11px] font-black uppercase text-[#111111] outline-none focus:ring-1 focus:ring-[#d71920]"
                            >
                              <option value="">Sin entrenador</option>
                              {trainerOptions.map((trainer) => (
                                <option key={trainer.userId} value={trainer.userId}>
                                  {trainer.displayName.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
              </div>

              {/* TIPS DE GESTION */}
              <div className="bg-[#fbfbf8] border border-black/10 p-6 space-y-4">
                 <div className="flex items-center gap-2 text-[#111111]">
                    <Info className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Tip Operativo</p>
                 </div>
                 <p className="text-[11px] font-medium text-[#7a7f87] leading-relaxed italic">
                    &quot;Asegurate de que el email coincida con la cuenta de Auth para evitar problemas de sincronizacion en la App.&quot;
                 </p>
              </div>

            </div>
          </aside>
        </div>

        {/* ACCIONES DE FORMULARIO */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-t border-black/5 pt-10">
          <div className="flex-1">
            {feedback ? (
              <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-[#d71920] animate-pulse" />
                 <p className="text-xs font-bold uppercase tracking-tight text-[#111111]">{feedback}</p>
              </div>
            ) : null}
          </div>
          <Button 
            type="submit" 
            disabled={isPending}
            className="h-14 px-12 bg-[#111111] text-white font-black uppercase tracking-[0.2em] hover:bg-[#d71920] transition-all shadow-xl rounded-none"
          >
            {detail ? "Actualizar Registro" : "Crear Ficha Oficial"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
