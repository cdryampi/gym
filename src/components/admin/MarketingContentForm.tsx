"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch, type Control, type UseFormSetValue } from "react-hook-form";

import { saveMarketingContent } from "@/app/(admin)/dashboard/actions";
import AdminSurface from "@/components/admin/AdminSurface";
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
import type { MarketingPlan, MarketingScheduleRow } from "@/lib/data/marketing-content";
import {
  marketingContentSchema,
  type MarketingContentValues,
} from "@/lib/validators/marketing";
import { cn } from "@/lib/utils";

interface MarketingContentFormProps {
  plans: MarketingPlan[];
  scheduleRows: MarketingScheduleRow[];
  disabledReason?: string;
}

function createId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  // Fallback robusto para generar algo que parezca un UUID v4 si no hay crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function createPlan() {
  return {
    id: createId(),
    title: "",
    description: "",
    price_label: "",
    billing_label: "/mes",
    badge: "",
    is_featured: false,
    is_active: true,
    order: 0,
    features: [{ label: "", included: true }],
  };
}

function createScheduleRow() {
  return {
    id: createId(),
    label: "",
    description: "",
    opens_at: "",
    closes_at: "",
    is_active: true,
    order: 0,
  };
}

function syncPlanOrders(
  setValue: UseFormSetValue<MarketingContentValues>,
  nextPlans: MarketingContentValues["plans"],
) {
  nextPlans.forEach((_, index) => {
    setValue(`plans.${index}.order`, index, { shouldDirty: true });
  });
}

function syncScheduleOrders(
  setValue: UseFormSetValue<MarketingContentValues>,
  nextRows: MarketingContentValues["scheduleRows"],
) {
  nextRows.forEach((_, index) => {
    setValue(`scheduleRows.${index}.order`, index, { shouldDirty: true });
  });
}

function moveArrayItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

interface PlanFeaturesEditorProps {
  control: Control<MarketingContentValues>;
  planIndex: number;
  disabled: boolean;
}

function PlanFeaturesEditor({ control, planIndex, disabled }: Readonly<PlanFeaturesEditorProps>) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `plans.${planIndex}.features`,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
          Caracteristicas
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => append({ label: "", included: true })}
        >
          <Plus className="h-4 w-4" />
          Anadir linea
        </Button>
      </div>

      <div className="space-y-3">
        {fields.length === 0 && (
          <p className="py-2 text-center text-xs text-[#8c9198]">
            No hay caracteristicas. Pulsa &quot;Anadir linea&quot;.
          </p>
        )}
        {fields.map((field, featureIndex) => (
          <div
            key={field.id}
            className="grid gap-3 rounded-none border border-black/8 bg-[#fbfbf8] p-3 md:grid-cols-[minmax(0,1fr)_140px_auto]"
          >
            <FormField
              control={control}
              name={`plans.${planIndex}.features.${featureIndex}.label`}
              render={({ field: featureField }) => (
                <FormItem>
                  <FormLabel>Texto</FormLabel>
                  <FormControl>
                    <Input {...featureField} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`plans.${planIndex}.features.${featureIndex}.included`}
              render={({ field: featureField }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => featureField.onChange(!featureField.value)}
                      className={cn(
                        "flex h-12 w-full items-center justify-center gap-2 border px-4 text-sm font-semibold transition",
                        featureField.value
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-zinc-200 bg-zinc-50 text-zinc-600",
                      )}
                    >
                      {featureField.value ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      {featureField.value ? "Incluida" : "No incluida"}
                    </button>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-end justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || fields.length === 1}
                onClick={() => remove(featureIndex)}
              >
                <Trash2 className="h-4 w-4" />
                Quitar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarketingContentForm({
  plans,
  scheduleRows,
  disabledReason,
}: Readonly<MarketingContentFormProps>) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [openPlans, setOpenPlans] = useState<Record<string, boolean>>({ "0": true });
  const [openSchedules, setOpenSchedules] = useState<Record<string, boolean>>({ "0": true });

  const togglePlan = (idx: number) => {
    setOpenPlans((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleSchedule = (idx: number) => {
    setOpenSchedules((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const form = useForm<MarketingContentValues>({
    resolver: zodResolver(marketingContentSchema),
    defaultValues: {
      plans: plans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        description: plan.description ?? "",
        price_label: plan.price_label,
        billing_label: plan.billing_label,
        badge: plan.badge ?? "",
        is_featured: plan.is_featured,
        is_active: plan.is_active,
        order: plan.order,
        features: plan.features.map((feature) => ({
          label: feature.label,
          included: feature.included,
        })),
      })),
      scheduleRows: scheduleRows.map((row) => ({
        id: row.id,
        label: row.label,
        description: row.description ?? "",
        opens_at: row.opens_at,
        closes_at: row.closes_at,
        is_active: row.is_active,
        order: row.order,
      })),
    },
  });

  const planFields = useFieldArray({
    control: form.control,
    name: "plans",
  });

  const scheduleFields = useFieldArray({
    control: form.control,
    name: "scheduleRows",
  });

  const watchedPlans = useWatch({ control: form.control, name: "plans" }) ?? [];
  const watchedScheduleRows = useWatch({ control: form.control, name: "scheduleRows" }) ?? [];

  function handleMovePlan(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= watchedPlans.length) {
      return;
    }

    const nextPlans = moveArrayItem(watchedPlans, index, nextIndex);
    planFields.move(index, nextIndex);
    syncPlanOrders(form.setValue, nextPlans);
  }

  function handleMoveScheduleRow(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= watchedScheduleRows.length) {
      return;
    }

    const nextRows = moveArrayItem(watchedScheduleRows, index, nextIndex);
    scheduleFields.move(index, nextIndex);
    syncScheduleOrders(form.setValue, nextRows);
  }

  function handleFeaturedPlan(index: number) {
    watchedPlans.forEach((_, currentIndex) => {
      form.setValue(`plans.${currentIndex}.is_featured`, currentIndex === index, {
        shouldDirty: true,
      });
    });
  }

  function onSubmit(values: MarketingContentValues) {
    setFeedback(null);

    const normalizedValues: MarketingContentValues = {
      plans: values.plans.map((plan, index) => ({
        ...plan,
        order: index,
      })),
      scheduleRows: values.scheduleRows.map((row, index) => ({
        ...row,
        order: index,
      })),
    };

    startTransition(async () => {
      try {
        setFeedback(null);
        const result = await saveMarketingContent(normalizedValues);
        
        if (result.success) {
          form.reset(normalizedValues);
          setFeedback("Planes y horarios actualizados correctamente.");
        } else {
          setFeedback(result.error || "Error al guardar el contenido.");
        }
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Error fatal al procesar el guardado.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <AdminSurface className="space-y-5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-[#111111]">Planes</p>
                <p className="mt-1 text-sm text-[#5f6368]">
                  Edita nombre, precio, destacado y bullets del bloque comercial.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending || Boolean(disabledReason)}
                onClick={() => {
                  const nextPlans = [...watchedPlans, { ...createPlan(), order: watchedPlans.length }];
                  planFields.append(nextPlans[nextPlans.length - 1]);
                }}
              >
                <Plus className="h-4 w-4" />
                Anadir plan
              </Button>
            </div>

            <div className="space-y-4">
              {planFields.fields.map((field, index) => {
                const isOpen = openPlans[index] ?? false;
                const planValue = watchedPlans[index];

                return (
                  <AdminSurface
                    key={field.id}
                    inset
                    className="overflow-hidden border border-black/8 bg-[#fbfbf8]"
                  >
                    <div
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-4 p-4 transition-colors hover:bg-black/2",
                        !isOpen && "bg-[#fcfcfa]",
                      )}
                      onClick={() => togglePlan(index)}
                    >
                      <div className="flex flex-1 items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-black/8 bg-white text-xs font-bold text-[#111111]">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-[#111111]">
                              {planValue?.title || `Plan ${index + 1}`}
                            </span>
                            {planValue?.price_label && (
                              <span className="text-xs text-[#5f6368]">
                                • {planValue.price_label}
                                {planValue.billing_label}
                              </span>
                            )}
                            {planValue?.is_featured && (
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <div
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                planValue?.is_active ? "bg-emerald-500" : "bg-zinc-400",
                              )}
                            />
                            <span className="text-[10px] uppercase tracking-wider text-[#7a7f87]">
                              {planValue?.is_active ? "Activo" : "Oculto"}
                              {planValue?.badge && ` • ${planValue.badge}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="hidden sm:flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={isPending || index === 0}
                            onClick={() => handleMovePlan(index, -1)}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={isPending || index === planFields.fields.length - 1}
                            onClick={() => handleMovePlan(index, 1)}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isPending || Boolean(disabledReason) || planFields.fields.length === 1}
                          onClick={() => {
                            planFields.remove(index);
                            const nextPlans = form.getValues("plans");
                            syncPlanOrders(form.setValue, nextPlans);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500/70" />
                        </Button>
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 text-[#a1a1a1] transition-transform",
                            isOpen && "rotate-180",
                          )}
                        />
                      </div>
                    </div>

                    {isOpen && (
                      <div className="space-y-4 border-t border-black/6 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/50 p-2 border border-black/5">
                           <p className="text-xs font-semibold uppercase tracking-widest text-[#7a7f87]">
                             Configuracion de Plan {index + 1}
                           </p>
                           <Button
                            type="button"
                            variant={watchedPlans[index]?.is_featured ? "secondary" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            disabled={isPending || Boolean(disabledReason)}
                            onClick={() => handleFeaturedPlan(index)}
                          >
                            <Star className="mr-1 h-3 w-3" />
                            {watchedPlans[index]?.is_featured ? "Plan Destacado" : "Hacer Destacado"}
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`plans.${index}.title`}
                            render={({ field: planField }) => (
                              <FormItem>
                                <FormLabel>Nombre</FormLabel>
                                <FormControl>
                                  <Input {...planField} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`plans.${index}.badge`}
                            render={({ field: planField }) => (
                              <FormItem>
                                <FormLabel>Badge</FormLabel>
                                <FormControl>
                                  <Input placeholder="Recomendado" {...planField} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`plans.${index}.description`}
                          render={({ field: planField }) => (
                            <FormItem>
                              <FormLabel>Descripcion corta</FormLabel>
                              <FormControl>
                                <Textarea rows={2} placeholder="Texto comercial opcional." {...planField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`plans.${index}.price_label`}
                            render={({ field: planField }) => (
                              <FormItem>
                                <FormLabel>Precio visible</FormLabel>
                                <FormControl>
                                  <Input placeholder="S/150" {...planField} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`plans.${index}.billing_label`}
                            render={({ field: planField }) => (
                              <FormItem>
                                <FormLabel>Periodo</FormLabel>
                                <FormControl>
                                  <Input placeholder="/mes" {...planField} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`plans.${index}.is_active`}
                            render={({ field: planField }) => (
                              <FormItem>
                                <FormLabel>Visibilidad</FormLabel>
                                <FormControl>
                                  <button
                                    type="button"
                                    disabled={isPending || Boolean(disabledReason)}
                                    onClick={() => planField.onChange(!planField.value)}
                                    className={cn(
                                      "flex h-10 w-full items-center justify-center gap-2 border px-4 text-xs font-semibold transition",
                                      planField.value
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-zinc-200 bg-zinc-50 text-zinc-600",
                                    )}
                                  >
                                    {planField.value ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                    {planField.value ? "Activo en web" : "Oculto en web"}
                                  </button>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <AdminSurface className="flex items-center justify-between border-black/8 bg-white p-3">
                            <div>
                              <p className="text-xs font-semibold text-[#111111]">Plan destacado</p>
                              <p className="mt-1 text-[11px] text-[#5f6368]">
                                Solo uno se ve como recomendado.
                              </p>
                            </div>
                            <div
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                                watchedPlans[index]?.is_featured
                                  ? "bg-[#111111] text-white"
                                  : "bg-[#f3f4f6] text-[#6b7280]",
                              )}
                            >
                              {watchedPlans[index]?.is_featured ? "Activo" : "Normal"}
                            </div>
                          </AdminSurface>
                        </div>

                        <PlanFeaturesEditor
                          control={form.control}
                          planIndex={index}
                          disabled={isPending || Boolean(disabledReason)}
                        />
                      </div>
                    )}
                  </AdminSurface>
                );
              })}
            </div>
          </AdminSurface>

          <AdminSurface className="space-y-5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-[#111111]">Horarios</p>
                <p className="mt-1 text-sm text-[#5f6368]">
                  Gestiona las filas visibles del bloque de apertura.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending || Boolean(disabledReason)}
                onClick={() => scheduleFields.append({ ...createScheduleRow(), order: watchedScheduleRows.length })}
              >
                <Plus className="h-4 w-4" />
                Anadir fila
              </Button>
            </div>

            <div className="space-y-4">
              {scheduleFields.fields.map((field, index) => {
                const isOpen = openSchedules[index] ?? false;
                const rowValue = watchedScheduleRows[index];

                return (
                  <AdminSurface
                    key={field.id}
                    inset
                    className="overflow-hidden border border-black/8 bg-[#fbfbf8]"
                  >
                    <div
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-4 p-4 transition-colors hover:bg-black/2",
                        !isOpen && "bg-[#fcfcfa]",
                      )}
                      onClick={() => toggleSchedule(index)}
                    >
                      <div className="flex flex-1 items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-black/8 bg-white text-xs font-bold text-[#111111]">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-[#111111]">
                              {rowValue?.label || `Fila ${index + 1}`}
                            </span>
                            {(rowValue?.opens_at || rowValue?.closes_at) && (
                              <span className="text-xs text-[#5f6368]">
                                • {rowValue.opens_at} - {rowValue.closes_at}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <div
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                rowValue?.is_active ? "bg-emerald-500" : "bg-zinc-400",
                              )}
                            />
                            <span className="text-[10px] uppercase tracking-wider text-[#7a7f87]">
                              {rowValue?.is_active ? "Activo" : "Oculto"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="hidden sm:flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={isPending || index === 0}
                            onClick={() => handleMoveScheduleRow(index, -1)}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={isPending || index === scheduleFields.fields.length - 1}
                            onClick={() => handleMoveScheduleRow(index, 1)}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isPending || Boolean(disabledReason) || scheduleFields.fields.length === 1}
                          onClick={() => {
                            scheduleFields.remove(index);
                            const nextRows = form.getValues("scheduleRows");
                            syncScheduleOrders(form.setValue, nextRows);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500/70" />
                        </Button>
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 text-[#a1a1a1] transition-transform",
                            isOpen && "rotate-180",
                          )}
                        />
                      </div>
                    </div>

                    {isOpen && (
                      <div className="space-y-4 border-t border-black/6 p-4">
                        <div className="bg-white/50 p-2 border border-black/5">
                           <p className="text-xs font-semibold uppercase tracking-widest text-[#7a7f87]">
                             Configuracion de Fila {index + 1}
                           </p>
                        </div>

                        <FormField
                          control={form.control}
                          name={`scheduleRows.${index}.label`}
                          render={({ field: rowField }) => (
                            <FormItem>
                              <FormLabel>Titulo</FormLabel>
                              <FormControl>
                                <Input placeholder="Lunes - Viernes" {...rowField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`scheduleRows.${index}.description`}
                          render={({ field: rowField }) => (
                            <FormItem>
                              <FormLabel>Descripcion corta</FormLabel>
                              <FormControl>
                                <Textarea rows={2} placeholder="Opcional." {...rowField} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`scheduleRows.${index}.opens_at`}
                            render={({ field: rowField }) => (
                              <FormItem>
                                <FormLabel>Apertura</FormLabel>
                                <FormControl>
                                  <Input placeholder="05:00 AM" {...rowField} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`scheduleRows.${index}.closes_at`}
                            render={({ field: rowField }) => (
                              <FormItem>
                                <FormLabel>Cierre</FormLabel>
                                <FormControl>
                                  <Input placeholder="11:00 PM" {...rowField} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`scheduleRows.${index}.is_active`}
                          render={({ field: rowField }) => (
                            <FormItem>
                              <FormLabel>Visibilidad</FormLabel>
                              <FormControl>
                                <button
                                  type="button"
                                  disabled={isPending || Boolean(disabledReason)}
                                  onClick={() => rowField.onChange(!rowField.value)}
                                  className={cn(
                                    "flex h-10 w-full items-center justify-center gap-2 border px-4 text-xs font-semibold transition",
                                    rowField.value
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-zinc-200 bg-zinc-50 text-zinc-600",
                                  )}
                                >
                                  {rowField.value ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                  {rowField.value ? "Activo en web" : "Oculto en web"}
                                </button>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </AdminSurface>
                );
              })}
            </div>
          </AdminSurface>
        </div>

        <AdminSurface className="sticky bottom-4 z-10 border-black/10 bg-white/95 p-4 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-sm text-[#5f6368]" aria-live="polite">
                {isPending
                  ? "Guardando cambios..."
                  : feedback ?? disabledReason ?? "Edita los bloques comerciales y guarda para publicar."}
              </p>
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="text-xs text-red-600 font-medium">
                  Hay errores en {Object.keys(form.formState.errors).length} campos. Revisar planes y horarios.
                </div>
              )}
            </div>
            <Button
              type="submit"
              disabled={isPending || Boolean(disabledReason)}
              className="w-full sm:w-auto"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar marketing
            </Button>
          </div>
        </AdminSurface>
      </form>
    </Form>
  );
}
