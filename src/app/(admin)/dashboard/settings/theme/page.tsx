import { Palette, ExternalLink, Sparkles } from "lucide-react";

import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/site";
import ThemeEditorForm from "@/features/admin/branding/components/ThemeEditorForm";

export default async function ThemeDashboardPage() {
  const { settings, warning } = await getDashboardData();
  const { isReadOnly } = await getDashboardCapabilities();
  const disabledReason = isReadOnly
    ? "Modo lectura: SUPABASE_SECRET_KEY no configurada."
    : undefined;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-black/5 pb-8">
        <DashboardPageHeader
          title="ESTILO & PERSONALIZACION"
          description="Edita el motor de temas visuales: colores, bordes y tipografias globales."
          icon={Palette}
          eyebrow="Visual Engine"
          className="pb-0"
        />
        <div className="flex items-center gap-3">
           <a 
             href="/" 
             target="_blank" 
             className="bg-secondary text-white px-6 h-12 flex items-center gap-3 font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg text-[10px]"
           >
             Ver Sitio <ExternalLink className="h-3 w-3" />
           </a>
        </div>
      </div>

      {warning && <DashboardNotice message={warning} tone="warning" />}
      {disabledReason && <DashboardNotice message={disabledReason} tone="info" />}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8 p-6 bg-primary/5 border-l-4 border-primary">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="size-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Live Editor</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground leading-relaxed">
            Los cambios en esta seccion se reflejan **instantaneamente** en tu navegador como una vista previa. 
            Para hacerlos permanentes para todos los usuarios, haz clic en **Aplicar Tema**.
          </p>
        </div>

        <ThemeEditorForm 
          initialConfig={settings.theme_config} 
          isReadOnly={isReadOnly} 
        />
      </div>
    </div>
  );
}
