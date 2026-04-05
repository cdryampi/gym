"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Check, Dumbbell, Calendar, MessageSquare, Info, Zap } from "lucide-react";

import { assignRoutineFromDashboardAction } from "@/app/(admin)/dashboard/miembros/actions";
import type { RoutineTemplateListItemDto } from "@mobile-contracts";
import { assignRoutineFormSchema, type AssignRoutineFormValues } from "@/lib/validators/gym-routines";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

interface AssignRoutinePanelProps {
  memberId: string;
  templates: RoutineTemplateListItemDto[];
}

export default function AssignRoutinePanel({
  memberId,
  templates,
}: Readonly<AssignRoutinePanelProps>) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<AssignRoutineFormValues>({
    resolver: zodResolver(assignRoutineFormSchema),
    defaultValues: {
      memberId,
      templateId: templates[0]?.id ?? "",
      notes: "",
      recommendedScheduleLabel: "",
      startsOn: new Date().toISOString().slice(0, 10),
      endsOn: null,
    },
  });

  const selectedId = useWatch({
    control: form.control,
    name: "templateId",
  });
  const selectedTemplate = templates.find(t => t.id === selectedId);

  function onSubmit(values: AssignRoutineFormValues) {
    setFeedback(null);
    startTransition(async () => {
      try {
        await assignRoutineFromDashboardAction(values);
        setFeedback("Asignacion completada con exito.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Error al asignar.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_340px]">
          
          {/* MAIN: SELECTOR DE PLANTILLAS (GRID) */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-black/5 pb-4">
               <Dumbbell className="h-5 w-5 text-[#d71920]" />
               <h3 className="font-display text-xl font-black uppercase tracking-tighter text-[#111111]">Catálogo de Entrenamiento</h3>
            </div>

            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {templates.length ? (
                        templates.map((template) => {
                          const isSelected = field.value === template.id;
                          return (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => field.onChange(template.id)}
                              className={cn(
                                "group relative flex flex-col text-left p-5 border transition-all duration-300",
                                isSelected 
                                  ? "bg-[#111111] border-[#111111] text-white shadow-2xl translate-y-[-4px]" 
                                  : "bg-white border-black/10 text-[#111111] hover:border-[#111111]"
                              )}
                            >
                              {isSelected && (
                                <div className="absolute top-4 right-4 h-6 w-6 bg-[#d71920] flex items-center justify-center animate-in zoom-in">
                                   <Check className="h-4 w-4 text-white" />
                                </div>
                              )}
                              
                              <p className={cn("text-[9px] font-black uppercase tracking-widest mb-2", isSelected ? "text-white/40" : "text-[#7a7f87]")}>
                                {template.goal}
                              </p>
                              <h4 className="font-display text-lg font-black uppercase tracking-tight leading-tight mb-3">
                                {template.title}
                              </h4>
                              
                              <p className={cn("text-xs leading-relaxed line-clamp-2 mb-4", isSelected ? "text-white/60" : "text-[#5f6368]")}>
                                {template.summary}
                              </p>

                              <div className="mt-auto pt-4 border-t border-current/10 flex items-center gap-3">
                                 <Badge variant="muted" className={cn("text-[9px] font-black uppercase", isSelected ? "bg-white/10 text-white border-none" : "bg-black/5 text-[#111111]")}>
                                    {template.difficultyLabel}
                                 </Badge>
                                 <span className={cn("text-[10px] font-bold uppercase", isSelected ? "text-white/40" : "text-[#7a7f87]")}>
                                    {template.exerciseCount} Ex.
                                 </span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="sm:col-span-2 p-12 text-center border-2 border-dashed border-black/10 bg-[#fbfbf8]">
                           <p className="text-sm font-bold text-[#7a7f87] uppercase tracking-widest text-center">No hay plantillas disponibles.</p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* SIDEBAR: CONFIGURACION DE LA ASIGNACION */}
          <aside className="space-y-8">
            <div className="sticky top-24 space-y-8">
              
              {/* STATUS CARD */}
              {selectedTemplate && (
                <div className="bg-[#fbfbf8] border border-black/10 p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-right-4">
                   <div className="flex items-center gap-2 text-[#111111]">
                      <Zap className="h-4 w-4 fill-current text-[#d71920]" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Setup de Carga</p>
                   </div>
                   <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="startsOn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-black uppercase text-[#7a7f87]">Fecha de Activación</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/20" />
                                <input
                                  type="date"
                                  value={field.value ?? ""}
                                  onChange={(event) => field.onChange(event.target.value || null)}
                                  className="flex h-10 w-full border border-black/10 bg-white pl-9 pr-3 text-xs font-bold outline-none focus:ring-1 focus:ring-[#d71920]"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recommendedScheduleLabel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-black uppercase text-[#7a7f87]">Hora Recomendada</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej. Lun/Mie/Vie · 19:00"
                                className="rounded-none border-black/10 bg-white text-xs font-bold focus-visible:ring-[#d71920]"
                                value={field.value ?? ""}
                                onChange={(event) => field.onChange(event.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-black uppercase text-[#7a7f87]">Notas para el Socio</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 h-3.5 w-3.5 text-black/20" />
                                <Textarea
                                  placeholder="Ej. Centrate en la tecnica del dia 1..."
                                  className="min-h-[120px] rounded-none border-black/10 bg-white pl-9 text-xs font-medium focus:ring-1 focus:ring-[#d71920]"
                                  value={field.value ?? ""}
                                  onChange={(event) => field.onChange(event.target.value)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   </div>
                </div>
              )}

              {/* ASIGNACION FOOTER */}
              <div className="space-y-4">
                 <Button 
                   type="submit" 
                   disabled={isPending || templates.length === 0 || !selectedId}
                   className="w-full h-14 bg-[#111111] text-white font-black uppercase tracking-[0.2em] hover:bg-[#d71920] transition-all shadow-xl rounded-none group"
                 >
                   {isPending ? "Procesando..." : (
                     <span className="flex items-center gap-3">
                        Asignar Carga <Check className="h-4 w-4 group-hover:scale-125 transition-transform" />
                     </span>
                   )}
                 </Button>
                 
                 {feedback && (
                   <div className="bg-[#eef9f1] border border-[#237447]/10 p-4 flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#237447] animate-pulse" />
                      <p className="text-[10px] font-bold text-[#237447] uppercase">{feedback}</p>
                   </div>
                 )}
              </div>

              <div className="flex items-start gap-3 p-4 bg-white border border-black/5 shadow-sm">
                 <Info className="h-4 w-4 text-black/20 shrink-0 mt-0.5" />
                 <p className="text-[10px] leading-relaxed text-[#7a7f87] font-medium italic">
                    &quot;La rutina se activara inmediatamente en la App del socio al confirmar la asignacion.&quot;
                 </p>
              </div>

            </div>
          </aside>
        </div>
      </form>
    </Form>
  );
}
