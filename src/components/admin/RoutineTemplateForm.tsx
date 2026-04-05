"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GripVertical, Plus, Smartphone, Trash2, Eye, Layout } from "lucide-react";
import { useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { saveRoutineTemplateAction } from "@/app/(admin)/dashboard/rutinas/actions";
import type { DashboardRoutineTemplateDetail } from "@/lib/data/gym-management";
import { routineTemplateFormSchema, type RoutineTemplateFormValues } from "@/lib/validators/gym-routines";
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
import { cn } from "@/lib/utils";

function buildEmptyExercise() {
  return {
    name: "",
    notes: null,
    reps: "",
    restSeconds: 60,
    sets: "",
  };
}

function buildEmptyBlock() {
  return {
    description: null,
    exercises: [buildEmptyExercise()],
    title: "",
  };
}

function toFormValues(detail?: DashboardRoutineTemplateDetail | null): RoutineTemplateFormValues {
  return {
    title: detail?.template.title ?? "",
    goal: detail?.template.goal ?? "Hipertrofia",
    summary: detail?.template.summary ?? "",
    durationLabel: detail?.template.durationLabel ?? "60 min",
    difficultyLabel: detail?.template.difficultyLabel ?? "Media",
    intensityLabel: detail?.template.intensityLabel ?? "Moderada",
    statusLabel: detail?.template.statusLabel ?? "Activa",
    isActive: detail?.isActive ?? true,
    notes: detail?.template.notes ?? null,
    trainerUserId: detail?.trainerUserId ?? null,
    blocks:
      detail?.template.blocks.map((block) => ({
        description: block.description,
        exercises: block.exercises.map((exercise) => ({
          name: exercise.name,
          notes: exercise.notes,
          reps: exercise.reps,
          restSeconds: exercise.restSeconds,
          sets: exercise.sets,
        })),
        title: block.title,
      })) ?? [buildEmptyBlock()],
  };
}

// COMPONENTE: Mockup de Teléfono para Preview
function MobilePreview({ values }: { values: RoutineTemplateFormValues }) {
  return (
    <div className="sticky top-24 mx-auto w-[320px] overflow-hidden rounded-[3rem] border-[8px] border-[#111111] bg-white shadow-2xl">
      <div className="absolute top-0 left-1/2 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-[#111111]" />
      <div className="h-[600px] overflow-y-auto bg-[#fbfbf8] custom-scrollbar">
        {/* Header Mockup */}
        <div className="bg-[#111111] p-6 pt-10 text-white">
           <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Rutina socio</p>
           <h4 className="mt-1 font-display text-2xl font-bold leading-tight uppercase">{values.title || "Sin titulo"}</h4>
        </div>
        
        {/* Stats Mockup */}
        <div className="grid grid-cols-2 gap-px bg-black/5 border-b border-black/5">
           <div className="bg-white p-4 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#4b5563]">Objetivo</p>
              <p className="mt-1 text-xs font-black text-[#111111] uppercase">{values.goal}</p>
           </div>
           <div className="bg-white p-4 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#4b5563]">Dificultad</p>
              <p className="mt-1 text-xs font-black text-[#111111] uppercase">{values.difficultyLabel}</p>
           </div>
        </div>

        {/* Blocks Mockup */}
        <div className="p-4 space-y-4">
           {values.blocks.map((block, i) => (
             <div key={i} className="space-y-3">
                <div className="flex items-center gap-2">
                   <div className="h-px flex-1 bg-black/5" />
                   <p className="text-[10px] font-bold uppercase tracking-widest text-[#4b5563]">{block.title || `Bloque ${i+1}`}</p>
                   <div className="h-px flex-1 bg-black/5" />
                </div>
                {block.exercises.map((ex, j) => (
                  <div key={j} className="border-l-2 border-[#d71920] bg-white p-3 shadow-sm">
                     <p className="text-[11px] font-black uppercase text-[#111111]">{ex.name || "Ejercicio..."}</p>
                     <p className="mt-1 text-[10px] font-medium text-[#4b5563]">{ex.sets} x {ex.reps} • {String(ex.restSeconds)}s</p>
                  </div>
                ))}
             </div>
           ))}
        </div>
      </div>
      <div className="absolute bottom-2 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-black/20" />
    </div>
  );
}

function RoutineBlockEditor({
  blockIndex,
  control,
  removeBlock,
}: {
  blockIndex: number;
  control: ReturnType<typeof useForm<RoutineTemplateFormValues>>["control"];
  removeBlock(): void;
}) {
  const exercises = useFieldArray({
    control,
    name: `blocks.${blockIndex}.exercises`,
  });

  return (
    <div className="group relative space-y-6 border border-black/10 bg-white p-8 transition-all hover:border-[#d71920]/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 pb-6">
        <div className="flex items-center gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none bg-[#111111] font-display text-xl font-bold text-white">
            {String(blockIndex + 1).padStart(2, "0")}
          </div>
          <FormField
            control={control}
            name={`blocks.${blockIndex}.title`}
            render={({ field }) => (
              <FormItem className="flex-1 min-w-[240px]">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="TITULO DEL BLOQUE"
                    className="h-10 border-none bg-transparent p-0 text-2xl font-black uppercase tracking-tight shadow-none focus-visible:ring-0 placeholder:text-black/10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={removeBlock} 
          className="h-10 text-[#4b5563] hover:bg-[#d71920]/5 hover:text-[#d71920] font-bold uppercase tracking-wider text-[10px]"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Quitar bloque
        </Button>
      </div>

      <FormField
        control={control}
        name={`blocks.${blockIndex}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4b5563]">Instrucciones estrategicas</FormLabel>
            <FormControl>
              <Textarea
                rows={2}
                placeholder="Enfoque de la sesion, tempos generales o material necesario..."
                className="rounded-none border-black/10 bg-[#fbfbf8] focus:bg-white text-sm"
                value={typeof field.value === "string" ? field.value : ""}
                onChange={(event) => field.onChange(event.target.value || null)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#111111]">Ejercicios ({exercises.fields.length})</p>
           <div className="h-px flex-1 mx-4 bg-black/5" />
        </div>
        
        <div className="grid gap-4">
          {exercises.fields.map((exercise, exerciseIndex) => (
            <div key={exercise.id} className="relative flex flex-col gap-4 border border-black/5 bg-[#fbfbf8]/50 p-6 transition-all hover:bg-white hover:shadow-xl xl:flex-row xl:items-start">
              <div className="flex shrink-0 items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center border-2 border-[#111111] text-xs font-black">
                  {exerciseIndex + 1}
                </span>
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FormField
                    control={control}
                    name={`blocks.${blockIndex}.exercises.${exerciseIndex}.name`}
                    render={({ field }) => (
                      <FormItem className="xl:col-span-2">
                        <FormLabel className="text-[9px] font-bold uppercase text-[#4b5563]">Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej. Prensa de Piernas" className="font-bold uppercase tracking-tight" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`blocks.${blockIndex}.exercises.${exerciseIndex}.sets`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] font-bold uppercase text-[#4b5563]">Series</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="4" className="text-center font-bold" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`blocks.${blockIndex}.exercises.${exerciseIndex}.reps`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] font-bold uppercase text-[#4b5563]">Reps</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="12-15" className="text-center font-bold" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-[140px_1fr]">
                  <FormField
                    control={control}
                    name={`blocks.${blockIndex}.exercises.${exerciseIndex}.restSeconds`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] font-bold uppercase text-[#4b5563]">Descanso</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              step={15}
                              value={typeof field.value === "number" ? field.value : 0}
                              onChange={(event) => field.onChange(event.target.valueAsNumber || 0)}
                              className="pr-8 text-center font-bold"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#4b5563]">S</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`blocks.${blockIndex}.exercises.${exerciseIndex}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] font-bold uppercase text-[#4b5563]">Nota Tecnica (RPE, Tempo, etc)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej. Controlar la excentrica 3s..."
                            value={typeof field.value === "string" ? field.value : ""}
                            onChange={(event) => field.onChange(event.target.value || null)}
                            className="bg-transparent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 xl:flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 hover:bg-black/5"
                  onClick={() => exerciseIndex > 0 && exercises.move(exerciseIndex, exerciseIndex - 1)}
                  disabled={exerciseIndex === 0}
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-[#4b5563] hover:bg-[#d71920]/5 hover:text-[#d71920]"
                  onClick={() => exercises.remove(exerciseIndex)}
                  disabled={exercises.fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full border-2 border-dashed border-black/10 py-8 font-black uppercase tracking-widest hover:border-[#d71920]/40 hover:bg-[#fff3f3] hover:text-[#d71920]"
          onClick={() => exercises.append(buildEmptyExercise())}
        >
          <Plus className="mr-2 h-5 w-5" />
          Anadir ejercicio
        </Button>
      </div>
    </div>
  );
}

interface RoutineTemplateFormProps {
  detail?: DashboardRoutineTemplateDetail | null;
}

export default function RoutineTemplateForm({
  detail,
}: Readonly<RoutineTemplateFormProps>) {
  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<RoutineTemplateFormValues>({
    resolver: zodResolver(routineTemplateFormSchema),
    defaultValues: toFormValues(detail),
  });
  const blocks = useFieldArray({
    control: form.control,
    name: "blocks",
  });

  const formValues = useWatch({
    control: form.control,
  });

  function onSubmit(values: RoutineTemplateFormValues) {
    setFeedback(null);
    startTransition(async () => {
      try {
        await saveRoutineTemplateAction(values, detail?.template.id);
        setFeedback("Cambios guardados con exito.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Error al guardar.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* BARRA DE HERRAMIENTAS SUPERIOR */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-[#fbfbf8] p-4 shadow-sm sticky top-0 z-10">
           <div className="flex items-center gap-2 rounded-none border border-black/10 p-1 bg-white">
              <button
                type="button"
                onClick={() => setViewMode("editor")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  viewMode === "editor" ? "bg-[#111111] text-white" : "text-[#4b5563] hover:bg-black/5"
                )}
              >
                <Layout className="h-3 w-3" />
                Constructor
              </button>
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  viewMode === "preview" ? "bg-[#111111] text-white" : "text-[#4b5563] hover:bg-black/5"
                )}
              >
                <Eye className="h-3 w-3" />
                Vista Previa
              </button>
           </div>
           
           <div className="flex items-center gap-4">
              {feedback ? (
                <p className="text-[10px] font-bold uppercase text-[#d71920] animate-pulse">{feedback}</p>
              ) : null}
              <Button type="submit" disabled={isPending} className="bg-[#111111] h-10 px-8 font-black uppercase tracking-widest hover:bg-[#d71920]">
                {isPending ? "Guardando..." : "Guardar Rutina"}
              </Button>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_360px]">
           {/* COLUMNA PRINCIPAL */}
           <div className="space-y-12">
              {viewMode === "editor" ? (
                <>
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                       <h2 className="font-display text-3xl font-bold uppercase tracking-tighter text-[#111111]">Estructura</h2>
                       <div className="h-px flex-1 bg-black/10" />
                    </div>
                    
                    <div className="space-y-10">
                      {blocks.fields.map((block, blockIndex) => (
                        <RoutineBlockEditor
                          key={block.id}
                          blockIndex={blockIndex}
                          control={form.control}
                          removeBlock={() => blocks.remove(blockIndex)}
                        />
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-20 w-full border-2 border-dashed border-black/10 bg-[#fbfbf8]/50 font-black uppercase tracking-[0.2em] text-[#4b5563] hover:border-[#111111] hover:bg-white hover:text-[#111111]"
                      onClick={() => blocks.append(buildEmptyBlock())}
                    >
                      <Plus className="mr-3 h-6 w-6" />
                      Anadir nuevo bloque de entrenamiento
                    </Button>
                  </section>

                  <section className="space-y-6 border-t border-black/5 pt-12">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4b5563]">Notas de Staff y Publicacion</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                       <FormField
                        control={form.control}
                        name="summary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-bold uppercase tracking-wider text-[#111111]">Resumen para el Socio</FormLabel>
                            <FormControl>
                              <Textarea rows={4} {...field} placeholder="Que lograra el socio..." className="rounded-none border-black/10 text-sm" />
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
                            <FormLabel className="text-[9px] font-bold uppercase tracking-wider text-[#111111]">Notas Operativas</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={4}
                                placeholder="Instrucciones para otros coaches..."
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
                  </section>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[600px] border-2 border-dashed border-black/5 bg-[#fbfbf8]">
                   <p className="text-sm font-bold text-[#4b5563] uppercase tracking-widest">Utiliza el panel lateral para ver el preview real</p>
                </div>
              )}
           </div>

           {/* COLUMNA DERECHA: Preview / Config Rapida */}
           <div className="space-y-8">
              <div className="sticky top-24 space-y-8">
                {viewMode === "preview" ? (
                   <MobilePreview values={formValues} />
                ) : (
                  <div className="space-y-6">
                    <div className="bg-[#111111] p-6 text-white">
                      <h4 className="font-display text-xl font-bold uppercase tracking-tighter">Atributos Pro</h4>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Configura el ADN de la rutina</p>
                    </div>
                    
                    <div className="space-y-4 border border-black/10 bg-white p-6 shadow-sm">
                      <FormField control={form.control} name="goal" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-bold uppercase text-[#4b5563]">Objetivo Principal</FormLabel>
                          <FormControl>
                            <select {...field} className="flex h-10 w-full border border-black/10 bg-white px-3 text-xs font-bold uppercase text-[#111111] outline-none focus:ring-1 focus:ring-[#d71920]">
                              <option value="Perdida de peso">Perdida de peso</option>
                              <option value="Hipertrofia">Hipertrofia</option>
                              <option value="Fuerza">Fuerza</option>
                              <option value="Acondicionamiento">Acondicionamiento</option>
                              <option value="Salud / Movilidad">Salud / Movilidad</option>
                            </select>
                          </FormControl>
                        </FormItem>
                      )} />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="difficultyLabel" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-bold uppercase text-[#4b5563]">Dificultad</FormLabel>
                            <FormControl>
                              <select {...field} className="flex h-10 w-full border border-black/10 bg-white px-3 text-xs font-bold uppercase text-[#111111] outline-none focus:ring-1 focus:ring-[#d71920]">
                                <option value="Principiante">Principiante</option>
                                <option value="Media">Media</option>
                                <option value="Avanzada">Avanzada</option>
                                <option value="Elite">Elite</option>
                              </select>
                            </FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="intensityLabel" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-bold uppercase text-[#4b5563]">Intensidad</FormLabel>
                            <FormControl>
                              <select {...field} className="flex h-10 w-full border border-black/10 bg-white px-3 text-xs font-bold uppercase text-[#111111] outline-none focus:ring-1 focus:ring-[#d71920]">
                                <option value="Baja">Baja</option>
                                <option value="Moderada">Moderada</option>
                                <option value="Alta">Alta</option>
                                <option value="Muy Alta">Muy Alta</option>
                              </select>
                            </FormControl>
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="durationLabel" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-bold uppercase text-[#4b5563]">Duracion Sesion</FormLabel>
                          <FormControl>
                            <select {...field} className="flex h-10 w-full border border-black/10 bg-white px-3 text-xs font-bold uppercase text-[#111111] outline-none focus:ring-1 focus:ring-[#d71920]">
                              <option value="30 min">30 min</option>
                              <option value="45 min">45 min</option>
                              <option value="60 min">60 min</option>
                              <option value="90 min">90 min</option>
                            </select>
                          </FormControl>
                        </FormItem>
                      )} />
                      
                      <div className="h-px bg-black/5 my-2" />
                      
                      <div className="bg-[#fbfbf8] p-4 border border-black/5 space-y-4">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-[#4b5563]">Estado App</span>
                            <div className="flex items-center gap-2">
                               <div className={cn("h-2 w-2 rounded-full", formValues.isActive ? "bg-green-500" : "bg-red-500")} />
                               <span className="text-[10px] font-black uppercase text-[#111111]">{formValues.isActive ? "Visible" : "Oculta"}</span>
                            </div>
                         </div>
                         <p className="text-[10px] leading-relaxed text-[#4b5563]">
                            Al guardar como visible, la rutina estara disponible para ser asignada inmediatamente por cualquier coach.
                         </p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setViewMode("preview")}
                      className="group flex w-full items-center justify-between bg-white border border-black/10 p-5 transition-all hover:border-[#111111] shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 group-hover:bg-[#111111] group-hover:text-white transition-all">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black uppercase text-[#111111]">Ver en Mobile</p>
                          <p className="text-[10px] text-[#4b5563]">Simular vista del socio</p>
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-[#4b5563] group-hover:text-[#111111]" />
                    </button>
                  </div>
                )}
              </div>
           </div>
        </div>
      </form>
    </Form>
  );
}
