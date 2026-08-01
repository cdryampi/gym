"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw, Palette, Info, FileCode } from "lucide-react";
import { useTransition, useEffect } from "react";
import { useForm, useFormContext, useWatch, type Path } from "react-hook-form";
import { toast } from "sonner";

import { updateThemeAction } from "@/app/(admin)/dashboard/actions";
import { AdminSection } from "@/components/admin/shared/layout/AdminSection";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AdminCodeEditor } from "@/components/admin/shared/forms/AdminCodeEditor";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { themeConfigSchema, type ThemeConfig } from "@/lib/validators/theme";

interface ThemeEditorFormProps {
  initialConfig: ThemeConfig;
  isReadOnly?: boolean;
}

export default function ThemeEditorForm({ initialConfig, isReadOnly }: ThemeEditorFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ThemeConfig>({
    resolver: zodResolver(themeConfigSchema),
    defaultValues: initialConfig,
  });

  const currentValues = useWatch({ control: form.control });

  useEffect(() => {
    const root = document.documentElement;
    if (currentValues.colors) {
      root.style.setProperty("--brand-primary", currentValues.colors.primary ?? null);
      root.style.setProperty("--surface-background", currentValues.colors.background ?? null);
    }
    
    let styleTag = document.getElementById("dynamic-theme-preview");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "dynamic-theme-preview";
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = currentValues.custom_css || "";
  }, [currentValues]);

  function onSubmit(values: ThemeConfig) {
    startTransition(async () => {
      try {
        const result = await updateThemeAction(values);
        if (result.success) {
          toast.success("Cambios publicados correctamente.");
          form.reset(values); // Resetear el estado dirty con los nuevos valores
        } else {
          toast.error(result.error ?? "Error al guardar.");
        }
      } catch {
        toast.error("Error de conexión con el servidor.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        
        <AdminSection title="Variables de Color" icon={Palette}>
          <div className="grid gap-8 md:grid-cols-2">
            <ColorField 
              name="colors.primary" 
              label="Color Primario" 
              tooltip="Color de acento (--brand-primary)."
            />
            <ColorField 
              name="colors.background" 
              label="Fondo del Sitio" 
              tooltip="Color de fondo (--surface-background)."
            />
          </div>
        </AdminSection>

        <AdminSection 
          title="Hoja de Estilos Personalizada" 
          icon={FileCode} 
          description="Escribe reglas CSS puras."
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
              <ThemeTooltip message="Usa variables CSS o clases de Tailwind." />
              <span>Editor CSS Profesional</span>
            </div>
            <AdminCodeEditor name="custom_css" />
          </div>
        </AdminSection>

        <div className="flex justify-end gap-4 border-t border-black/5 pt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isPending || isReadOnly}
            className="h-12 px-6 rounded-none font-bold uppercase tracking-widest"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar
          </Button>
          <Button
            type="submit"
            disabled={isPending || isReadOnly}
            className="h-12 px-10 rounded-none bg-primary text-white font-black uppercase tracking-[0.2em] shadow-lg"
          >
            {isPending ? "Guardando..." : "Publicar Cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ColorField({ name, label, tooltip }: { name: Path<ThemeConfig>; label: string; tooltip: string }) {
  const { control } = useFormContext<ThemeConfig>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-2 mb-2">
            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {label}
            </FormLabel>
            <ThemeTooltip message={tooltip} />
          </div>
          <FormControl>
            <div className="flex gap-3">
              <Input 
                type="color" 
                {...field}
                value={typeof field.value === "string" ? field.value : ""}
                className="w-16 h-12 p-1 cursor-pointer border-black/10 rounded-none bg-white" 
              />
              <Input 
                {...field}
                value={typeof field.value === "string" ? field.value : ""}
                placeholder="#000000" 
                className="flex-1 font-mono uppercase border-black/10 rounded-none"
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ThemeTooltip({ message }: { message: string }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Info className="size-3 text-muted-foreground/40 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-secondary text-white border-none p-3 text-[10px] font-bold uppercase tracking-tight max-w-[200px]">
          {message}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
