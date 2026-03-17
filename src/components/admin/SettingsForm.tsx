"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

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
import { formatSeoKeywordsInput } from "@/lib/seo";
import type { SiteSettings } from "@/lib/supabase/database.types";
import { siteSettingsSchema, type SiteSettingsValues } from "@/lib/validators/settings";

import AdminCollapsibleSection from "./AdminCollapsibleSection";
import AdminSurface from "./AdminSurface";

import { resolveTopbarVariant, formatDateTimeLocalInput } from "@/lib/topbar";

interface SettingsFormProps {
  settings: SiteSettings;
  disabledReason?: string;
}

export default function SettingsForm({ settings, disabledReason }: SettingsFormProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SiteSettingsValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      ...settings,
      topbar_variant: resolveTopbarVariant(settings.topbar_variant),
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

  function onSubmit(values: SiteSettingsValues) {
    setFeedback(null);
    startTransition(async () => {
      try {
        await saveSiteSettings(values);
        setFeedback("Ajustes guardados.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Error al guardar.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...form.register("seo_og_image_url")} />
        <AdminSurface className="bg-[#f8f9fa] p-5">
          <p className="text-sm font-semibold">Ajustes Internos</p>
          <p className="mt-1 text-sm text-[#5f6368]">
            Configuración avanzada que suele editarse una sola vez.
          </p>
        </AdminSurface>

        <AdminCollapsibleSection title="Identidad del Sitio" description="Nombre y slogan base." defaultOpen>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="site_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Gimnasio</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="site_tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slogan o frase corta</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AdminCollapsibleSection>

        <AdminCollapsibleSection title="Buscadores (SEO)" description="Cómo aparece el gym en Google.">
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="seo_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título para Google</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seo_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumen informativo</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seo_keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Palabras clave (separadas por coma)</FormLabel>
                  <FormControl>
                    <Input placeholder="gimnasio, pesas, yoga..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AdminCollapsibleSection>

        <AdminCollapsibleSection title="Pie de página (Footer)" description="Texto al final de la web.">
          <FormField
            control={form.control}
            name="footer_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Texto legal o de cierre</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </AdminCollapsibleSection>

        <AdminSurface className="sticky bottom-4 z-10 border-black/10 bg-white/95 p-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[#5f6368]">{feedback ?? disabledReason}</p>
            <Button type="submit" disabled={isPending || Boolean(disabledReason)}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar ajustes avanzados
            </Button>
          </div>
        </AdminSurface>
      </form>
    </Form>
  );
}
