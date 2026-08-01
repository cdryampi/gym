"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Save, Upload, Video } from "lucide-react";
import { useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { saveTrainingZone } from "@/app/(admin)/dashboard/actions";
import AdminSurface from "@/components/admin/AdminSurface";
import NFImageUploader from "@/components/admin/shared/NFImageUploader";
import { AdminFormCheckbox } from "@/components/admin/shared/forms/AdminFormCheckbox";
import { AdminFormField } from "@/components/admin/shared/forms/AdminFormField";
import { AdminFormSelect } from "@/components/admin/shared/forms/AdminFormSelect";
import { AdminFormTextarea } from "@/components/admin/shared/forms/AdminFormTextarea";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import type { TrainingZone } from "@/data/training-zones";
import { toTrainingZonesFormValues } from "@/features/admin/marketing/services/marketing-mappers";
import { uploadAdminVideo } from "@/lib/media/admin-video-upload";
import { trainingZonesSchema, type TrainingZonesValues } from "@/lib/validators/training-zone";

const iconOptions = [
  { value: "dumbbell", label: "Fuerza" },
  { value: "flame", label: "HIIT" },
  { value: "heart-pulse", label: "Cardio" },
  { value: "users", label: "Clases" },
  { value: "bike", label: "Ciclo" },
];

interface TrainingZonesFormProps {
  disabledReason?: string;
  zones: TrainingZone[];
}

export default function TrainingZonesForm({
  disabledReason,
  zones,
}: Readonly<TrainingZonesFormProps>) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  const form = useForm<TrainingZonesValues>({
    resolver: zodResolver(trainingZonesSchema),
    defaultValues: toTrainingZonesFormValues(zones),
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "trainingZones",
  });
  const watchedZones = useWatch({
    control: form.control,
    name: "trainingZones",
  });

  const isBusy = isPending || uploadingIndex !== null;
  const hasErrors = Boolean(form.formState.errors.trainingZones);

  async function handleVideoUpload(index: number, file: File | undefined) {
    if (!file) {
      return;
    }

    setUploadingIndex(index);
    setUploadProgress(0);
    setFeedback(null);

    try {
      const uploaded = await uploadAdminVideo(file, {
        onProgress: (percent) => setUploadProgress(percent),
      });
      form.setValue(`trainingZones.${index}.video_url`, uploaded.url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      
      // Auto-guardar tras subir video para evitar confusiones
      const updatedZone = form.getValues().trainingZones[index];
      startTransition(async () => {
        const result = await saveTrainingZone(updatedZone);
        if (result.success) {
          setFeedback("Video subido y zona guardada correctamente.");
          form.reset(form.getValues());
        } else {
          setFeedback(result.error ?? "Video subido, pero error al auto-guardar.");
        }
      });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo subir el video.");
    } finally {
      setUploadingIndex(null);
      setUploadProgress(0);
    }
  }

  function onSubmit(values: TrainingZonesValues) {
    setFeedback(null);

    const normalizedValues: TrainingZonesValues = {
      trainingZones: values.trainingZones.map((zone, index) => ({
        ...zone,
        order_index: Number.isFinite(zone.order_index) ? zone.order_index : index + 1,
      })),
    };

    startTransition(async () => {
      for (const zone of normalizedValues.trainingZones) {
        const result = await saveTrainingZone(zone);

        if (!result.success) {
          setFeedback(result.error ?? `No se pudo guardar ${zone.title}.`);
          return;
        }
      }

      form.reset(normalizedValues);
      setFeedback("Zonas de entrenamiento actualizadas correctamente.");
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-5">
          {fields.map((field, index) => {
            const zoneTitle = watchedZones[index]?.title;
            const posterUrl = watchedZones[index]?.poster_url;
            const videoUrl = watchedZones[index]?.video_url;
            const disabled = Boolean(disabledReason) || isBusy;

            return (
              <AdminSurface key={field.id} inset className="p-5">
                <div className="mb-5 flex flex-col gap-3 border-b border-black/8 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d71920]">
                      Zona {index + 1}
                    </p>
                    <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-[#111111]">
                      {zoneTitle || "Zona sin titulo"}
                    </h3>
                  </div>
                  <AdminFormCheckbox
                    name={`trainingZones.${index}.active`}
                    label="Visible en web"
                    disabled={disabled}
                  />
                </div>

                <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                  <div className="grid gap-4 md:grid-cols-2">
                    <AdminFormField
                      name={`trainingZones.${index}.title`}
                      label="Titulo"
                      disabled={disabled}
                    />
                    <AdminFormField
                      name={`trainingZones.${index}.short_label`}
                      label="Etiqueta corta"
                      disabled={disabled}
                    />
                    <AdminFormField
                      name={`trainingZones.${index}.slug`}
                      label="Slug"
                      disabled={disabled}
                    />
                    <AdminFormSelect
                      name={`trainingZones.${index}.icon`}
                      label="Icono"
                      options={iconOptions}
                      disabled={disabled}
                    />
                    <AdminFormField
                      name={`trainingZones.${index}.order_index`}
                      label="Orden"
                      type="number"
                      disabled={disabled}
                    />
                    <AdminFormField
                      name={`trainingZones.${index}.cta_label`}
                      label="Texto CTA"
                      disabled={disabled}
                    />
                    <AdminFormField
                      name={`trainingZones.${index}.cta_href`}
                      label="Enlace CTA"
                      disabled={disabled}
                    />
                    <AdminFormField
                      name={`trainingZones.${index}.video_url`}
                      label="URL video"
                      disabled={disabled}
                    />
                    <AdminFormTextarea
                      name={`trainingZones.${index}.subtitle`}
                      label="Subtitulo"
                      rows={3}
                      className="md:col-span-2"
                      disabled={disabled}
                    />
                    <AdminFormTextarea
                      name={`trainingZones.${index}.description`}
                      label="Descripcion"
                      rows={4}
                      className="md:col-span-2"
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name={`trainingZones.${index}.poster_url`}
                      render={() => (
                        <FormItem>
                          <NFImageUploader
                            value={posterUrl}
                            onChange={(url) => {
                              form.setValue(`trainingZones.${index}.poster_url`, url ?? "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              // Auto-guardar tras subir poster
                              const updatedZone = form.getValues().trainingZones[index];
                              startTransition(async () => {
                                const result = await saveTrainingZone(updatedZone);
                                if (result.success) {
                                  setFeedback("Poster actualizado y zona guardada.");
                                  form.reset(form.getValues());
                                } else {
                                  setFeedback(result.error ?? "Error al auto-guardar el poster.");
                                }
                              });
                            }}
                            scope="training-zone"
                            label="Poster"
                            aspectRatio="video"
                            disabled={disabled}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3 rounded-none border border-black/8 bg-white p-4">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-[#d71920]" />
                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">
                          Video pesado
                        </Label>
                      </div>
                      <label className="relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden border border-black/15 bg-black/[0.02] px-4 py-6 text-center transition hover:border-[#d71920]/40">
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="sr-only"
                          disabled={disabled}
                          onChange={(event) => {
                            void handleVideoUpload(index, event.target.files?.[0]);
                            event.target.value = "";
                          }}
                        />

                        {uploadingIndex === index ? (
                          <>
                            <div
                              className="absolute inset-0 bg-[#d71920]/5 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                            <div className="relative z-10 flex flex-col items-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin text-[#d71920]" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#d71920]">
                                Subiendo video... {uploadProgress}%
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-[#7a7f87]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">
                              Subir MP4, WebM o MOV
                            </span>
                          </>
                        )}
                      </label>
                      <p className="break-all text-[11px] leading-5 text-[#6f747b]">
                        {videoUrl || "Sin video asignado."}
                      </p>
                    </div>
                  </div>
                </div>
              </AdminSurface>
            );
          })}
        </div>

        <AdminSurface className="sticky bottom-4 z-10 border-black/10 bg-white/95 p-6 backdrop-blur shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-black uppercase tracking-tight text-[#111111]" aria-live="polite">
                {isPending
                  ? "Guardando cambios..."
                  : uploadingIndex !== null
                    ? "Subiendo video pesado..."
                    : feedback ?? disabledReason ?? "Edita zonas y guarda para publicar."}
              </p>
              {hasErrors ? (
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#d71920]">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Hay errores de validacion en las zonas.
                </div>
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={isBusy || Boolean(disabledReason)}
              className="h-14 rounded-none bg-[#111111] px-10 font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-[#d71920]"
            >
              {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Guardar zonas
            </Button>
          </div>
        </AdminSurface>
      </form>
    </Form>
  );
}
