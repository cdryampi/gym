"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { saveSiteSettings } from "@/app/(admin)/dashboard/actions";
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
import { formatSeoKeywordsInput } from "@/lib/seo";
import type { SiteSettings } from "@/lib/supabase/database.types";
import { formatDateTimeLocalInput } from "@/lib/topbar";
import { siteSettingsSchema, type SiteSettingsValues } from "@/lib/validators/settings";

interface GymInfoFormProps {
  settings: SiteSettings;
  disabledReason?: string;
}

export default function GymInfoForm({ settings, disabledReason }: GymInfoFormProps) {
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
      notification_email: settings.notification_email,
      transactional_from_email: settings.transactional_from_email,
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
        setFeedback("Datos guardados.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Error al guardar.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...form.register("seo_og_image_url")} />
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email publico de contacto</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <p className="text-xs leading-5 text-[#5f6368]">
                  Se muestra en la web publica, footer y formularios de contacto.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notification_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo operativo interno</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <p className="text-xs leading-5 text-[#5f6368]">
                  Aqui llegan los avisos internos de pedidos pickup y acciones operativas.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="transactional_from_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remitente transaccional</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <p className="text-xs leading-5 text-[#5f6368]">
                  Es el remitente visible de los emails transaccionales. Si no coincide con el remitente o alias SMTP autorizado, se usara como reply-to y el envio saldra desde el remitente tecnico configurado en servidor.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefono</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="whatsapp_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enlace de WhatsApp</FormLabel>
                <FormControl>
                  <Input placeholder="https://wa.me/..." {...field} />
                </FormControl>
                <p className="text-xs leading-5 text-[#5f6368]">
                  Este enlace alimenta el boton flotante de WhatsApp que se muestra en la portada.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Direccion fisica</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="opening_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horarios de atencion</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <AdminSurface className="sticky bottom-4 z-10 border-black/10 bg-white/95 p-4 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#5f6368]" aria-live="polite">
              {isPending
                ? "Guardando cambios..."
                : feedback ?? disabledReason ?? "Actualiza los datos y guarda para publicar."}
            </p>
            <Button
              type="submit"
              disabled={isPending || Boolean(disabledReason)}
              className="w-full sm:w-auto"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar informacion
            </Button>
          </div>
        </AdminSurface>
      </form>
    </Form>
  );
}
