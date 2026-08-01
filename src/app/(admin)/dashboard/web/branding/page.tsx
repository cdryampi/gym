import { Sparkles, ExternalLink } from "lucide-react";
import Link from "next/link";

import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/site";
import BrandingForm from "@/features/admin/branding/components/BrandingForm";

export default async function BrandingDashboardPage() {
  const { settings, warning } = await getDashboardData();
  const { isReadOnly } = await getDashboardCapabilities();
  const disabledReason = isReadOnly
    ? "Modo lectura: SUPABASE_SECRET_KEY no configurada."
    : undefined;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-black/5 pb-8">
        <DashboardPageHeader
          title="BRANDING & DESIGN"
          description="Gestiona la identidad visual, logotipos y paleta de colores global."
          icon={Sparkles}
          eyebrow="Identity Studio"
          className="pb-0"
        />
        <div className="flex items-center gap-3">
           <Link 
             href="/dashboard/web" 
             className="bg-white border border-black/10 px-6 h-12 flex items-center gap-3 font-black uppercase tracking-widest hover:border-secondary transition-all shadow-sm text-[10px]"
           >
             Volver a Web
           </Link>
           <a 
             href="/" 
             target="_blank" 
             className="bg-secondary text-white px-6 h-12 flex items-center gap-3 font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg text-[10px]"
           >
             Live Site <ExternalLink className="h-3 w-3" />
           </a>
        </div>
      </div>

      {warning && <DashboardNotice message={warning} tone="warning" />}
      {disabledReason && <DashboardNotice message={disabledReason} tone="info" />}

      <div className="max-w-5xl mx-auto">
        <BrandingForm settings={settings} disabledReason={disabledReason} />
      </div>
    </div>
  );
}
