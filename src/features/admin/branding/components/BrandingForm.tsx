"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, RotateCcw, Sparkles } from "lucide-react";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { updateBrandingAction } from "@/app/(admin)/dashboard/actions";
import AdminSurface from "@/components/admin/AdminSurface";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { SiteSettings } from "@/lib/supabase/database.types";
import { brandingSchema, type BrandingValues } from "@/lib/validators/branding";
import { cn } from "@/lib/utils";

import { toBrandingFormValues } from "../services/branding-mappers";
import { BrandingIdentitySection } from "./BrandingIdentitySection";
import { BrandingVisualsSection } from "./BrandingVisualsSection";
import { BrandingThemeSection } from "./BrandingThemeSection";
import { useBranding } from "./BrandingProvider";

interface BrandingFormProps {
  settings: SiteSettings;
  disabledReason?: string;
}

export default function BrandingForm({ settings, disabledReason }: BrandingFormProps) {
  const [isPending, startTransition] = useTransition();
  const { setBranding } = useBranding();

  const form = useForm<BrandingValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: toBrandingFormValues(settings),
  });

  const [gymName, primaryColor] = useWatch({
    control: form.control,
    name: ["gym_name", "primary_color"],
  });

  // Sync with provider for "live" preview in Sidebar during editing if desired, 
  // but let's stick to update on save for stability unless requested.
  // Actually, the prompt says "Optimistic UI for gym name in Sidebar"
  
  function onSubmit(values: BrandingValues) {
    // Optimistic Update
    setBranding({
      gymName: values.gym_name,
      logoUrl: values.logo_url,
      primaryColor: values.primary_color,
    });

    startTransition(async () => {
      try {
        const result = await updateBrandingAction(values);
        
        if (result.success) {
          toast.success("Identidad visual actualizada. Los cambios se aplicaran globalmente.");
        } else {
          // Rollback on error
          setBranding({
            gymName: settings.site_name,
            logoUrl: settings.logo_url,
            primaryColor: settings.primary_color ?? "#d71920",
          });
          toast.error(result.error ?? "Error al guardar los cambios.");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error critico al guardar branding.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        <AdminSurface className="bg-primary/5 p-6 border-l-4 border-l-primary border-t-0 border-r-0 border-b-0 rounded-none shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Identity Studio</p>
            </div>
            <p className="mt-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
              Motor de branding dinamico: Personaliza tu identidad visual en tiempo real.
            </p>
          </div>
          <div className="hidden md:block">
             <div className="flex items-center gap-4">
                <div className="text-right">
                   <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Vista Previa</p>
                   <p className="text-xs font-black uppercase tracking-widest">{gymName}</p>
                </div>
                <div 
                  className="size-8 rounded-full border-2 border-white shadow-md transition-colors duration-500" 
                  style={{ backgroundColor: primaryColor }}
                />
             </div>
          </div>
        </AdminSurface>

        <BrandingIdentitySection />
        <BrandingVisualsSection />
        <BrandingThemeSection />

        <AdminSurface className="sticky bottom-6 z-10 border-black/5 bg-white/90 p-5 backdrop-blur-xl shadow-2xl shadow-black/10 rounded-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" aria-live="polite">
              {disabledReason ? (
                <span className="text-destructive">{disabledReason}</span>
              ) : (
                <>ESTADO: <span className="text-primary font-black">MOTOR DE BRANDING LISTO</span></>
              )}
            </p>
            <Button
              type="submit"
              disabled={isPending || Boolean(disabledReason)}
              className={cn(
                "h-12 px-8 text-white font-black uppercase tracking-[0.2em] transition-all duration-500 rounded-xl shadow-lg",
                isPending ? "bg-black/40 text-white/50" : "bg-secondary hover:bg-primary hover:shadow-primary/20"
              )}
              style={!isPending ? { backgroundColor: primaryColor } : {}}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <RotateCcw className="size-4 animate-spin text-white/50" />
                  <span>Sincronizando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="size-4" />
                  <span>Publicar Identidad</span>
                </div>
              )}
            </Button>
          </div>
        </AdminSurface>
      </form>
    </Form>
  );
}
