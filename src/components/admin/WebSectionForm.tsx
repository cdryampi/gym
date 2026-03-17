"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { saveSiteSettings } from "@/app/(admin)/dashboard/actions";
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
import type { SiteSettings } from "@/lib/supabase/database.types";
import { formatSeoKeywordsInput } from "@/lib/seo";
import { formatDateTimeLocalInput, topbarVariants } from "@/lib/topbar";
import { siteSettingsSchema, type SiteSettingsValues } from "@/lib/validators/settings";

import AdminSurface from "./AdminSurface";
import AdminCollapsibleSection from "./AdminCollapsibleSection";

interface WebSectionFormProps {
  settings: SiteSettings;
  disabledReason?: string;
}

export default function WebSectionForm({ settings, disabledReason }: WebSectionFormProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SiteSettingsValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      ...settings,
      topbar_variant: settings.topbar_variant as SiteSettingsValues["topbar_variant"],
      topbar_text: settings.topbar_text ?? "",
      topbar_cta_label: settings.topbar_cta_label ?? "",
      topbar_cta_url: settings.topbar_cta_url ?? "",
      topbar_expires_at: formatDateTimeLocalInput(settings.topbar_expires_at),
      contact_phone: settings.contact_phone ?? "",
      whatsapp_url: settings.whatsapp_url ?? "",
      address: settings.address ?? "",
      opening_hours: settings.opening_hours ?? "",
      hero_video_url: settings.hero_video_url ?? "",
      seo_keywords: formatSeoKeywordsInput(settings.seo_keywords),
      seo_canonical_url: settings.seo_canonical_url ?? "",
      seo_og_image_url: settings.seo_og_image_url ?? "",
    },
  });

  const topbarEnabled = useWatch({ control: form.control, name: "topbar_enabled" });

  function onSubmit(values: SiteSettingsValues) {
    setFeedback(null);
    startTransition(async () => {
      try {
        await saveSiteSettings(values);
        setFeedback("Diseño actualizado.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Error al guardar.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...form.register("seo_og_image_url")} />
        <AdminCollapsibleSection
          title="Mensaje de bienvenida (Hero)"
          description="Lo primero que ven los clientes al entrar."
          defaultOpen
        >
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="hero_badge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto pequeño superior</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hero_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título principal</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hero_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="hero_primary_cta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Botón principal</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hero_secondary_cta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Botón secundario</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </AdminCollapsibleSection>

        <AdminCollapsibleSection
          title="Promo activa (Topbar)"
          description="Aviso especial con fecha de fin."
          defaultOpen={topbarEnabled}
        >
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="topbar_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 accent-[#d71920]"
                    />
                  </FormControl>
                  <div>
                    <p className="text-sm font-semibold">Mostrar promo</p>
                  </div>
                </FormItem>
              )}
            />
            {topbarEnabled && (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="topbar_variant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estilo</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="h-10 w-full rounded-md border border-input bg-background px-3"
                          >
                            {topbarVariants.map((v) => (
                              <option key={v} value={v}>
                                {v === "promotion" ? "Oferta" : v === "announcement" ? "Anuncio" : "Aviso"}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="topbar_expires_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>¿Cuándo termina?</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="topbar_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto de la promo</FormLabel>
                      <FormControl>
                        <Input placeholder="¡Matrícula gratis!" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </AdminCollapsibleSection>

        <AdminSurface className="sticky bottom-4 z-10 border-black/10 bg-white/95 p-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[#5f6368]">{feedback ?? disabledReason}</p>
            <Button type="submit" disabled={isPending || Boolean(disabledReason)}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar diseño
            </Button>
          </div>
        </AdminSurface>
      </form>
    </Form>
  );
}
