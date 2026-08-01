import { Globe, LayoutTemplate, Monitor, Smartphone, Eye, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";

import AdminSection from "@/components/admin/AdminSection";
import AdminSurface from "@/components/admin/AdminSurface";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import WebSectionForm from "@/components/admin/WebSectionForm";
import { getDashboardCapabilities } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/site";
import { Badge } from "@/components/ui/badge";

export default async function DashboardWebPage() {
  const { settings, warning } = await getDashboardData();
  const { isReadOnly } = await getDashboardCapabilities();
  const disabledReason = isReadOnly
    ? "Modo lectura: SUPABASE_SECRET_KEY no configurada."
    : undefined;

  return (
    <div className="space-y-10">
      {/* HEADER PRO */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-black/5 pb-8">
        <DashboardPageHeader
          title="IDENTITY STUDIO"
          description="Control centralizado de contenidos, identidad y visuales del sitio publico."
          icon={Globe}
          eyebrow="Frontend Control"
          className="pb-0"
        />
        <div className="flex items-center gap-3">
           <a 
             href="/" 
             target="_blank" 
             className="bg-white border border-black/10 px-6 h-12 flex items-center gap-3 font-black uppercase tracking-widest hover:border-[#111111] transition-all shadow-sm"
           >
             Live Site <ExternalLink className="h-3 w-3" />
           </a>
        </div>
      </div>

      {warning && <DashboardNotice message={warning} tone="warning" />}
      {disabledReason && <DashboardNotice message={disabledReason} tone="info" />}

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_340px]">
        
        {/* MAIN: EDITOR DE CONTENIDOS */}
        <main className="space-y-12 min-w-0">
          
          <AdminSection
            id="secciones"
            title="CONSTRUCTOR DE SECCIONES"
            description="Ajusta el tono de voz y los mensajes clave que ven tus prospectos."
            icon={LayoutTemplate}
            className="mt-0"
          >
            <div className="bg-white border border-black/10 shadow-sm p-1">
              <WebSectionForm settings={settings} disabledReason={disabledReason} />
            </div>
          </AdminSection>

          <section id="exploracion" className="space-y-6">
             <div className="flex items-center gap-3">
                <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-[#111111]">Exploracion Visual</h2>
                <div className="h-px flex-1 bg-black/10" />
             </div>
             <div className="grid gap-6 md:grid-cols-2">
                <Link href="/dashboard/cms" className="group bg-[#fbfbf8] border border-black/10 p-8 transition-all hover:border-[#111111]">
                   <Monitor className="h-8 w-8 text-black/10 group-hover:text-[#111111] transition-colors mb-4" />
                   <h3 className="text-xl font-display font-black text-[#111111] uppercase tracking-tighter">Media Library</h3>
                   <p className="text-sm text-[#7a7f87] mt-2">Gestiona las imagenes y recursos visuales del sitio publico.</p>
                </Link>
                <Link href="/dashboard/marketing" className="group bg-[#fbfbf8] border border-black/10 p-8 transition-all hover:border-[#111111]">
                   <Smartphone className="h-8 w-8 text-black/10 group-hover:text-[#111111] transition-colors mb-4" />
                   <h3 className="text-xl font-display font-black text-[#111111] uppercase tracking-tighter">Campaigns</h3>
                   <p className="text-sm text-[#7a7f87] mt-2">Configura landing pages y promociones temporales.</p>
                </Link>
             </div>
          </section>
        </main>

        {/* SIDEBAR: ESTADO Y PREVIEW */}
        <aside className="space-y-8">
          <div className="sticky top-24 space-y-8">
            
            {/* SITE STATUS CARD */}
            <AdminSurface className="p-0 overflow-hidden border-black/10 shadow-lg bg-white">
              <div className="bg-[#111111] p-6 text-white text-center">
                <div className="flex justify-center mb-4">
                   <div className="h-12 w-12 rounded-full border-2 border-white/10 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-[#d71920]" />
                   </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Status Publico</p>
                <h3 className="mt-2 font-display text-xl font-black uppercase tracking-tighter">Online · Produccion</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-black/5 pb-4">
                   <p className="text-[10px] font-bold uppercase text-[#7a7f87]">SEO Titulo</p>
                   <Badge variant="success" className="text-[9px]">Optimizado</Badge>
                </div>
                <div className="space-y-2">
                   <p className="text-[10px] font-bold uppercase text-[#7a7f87]">Ultimo Despliegue</p>
                   <p className="text-xs font-bold text-[#111111]">Hace 12 minutos via Dokploy</p>
                </div>
                <div className="bg-[#fbfbf8] p-4 border border-black/5 space-y-3">
                   <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3 w-3 text-green-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest">SSL Certificado</p>
                   </div>
                   <p className="text-[10px] text-[#7a7f87] leading-relaxed italic">
                     &quot;Tu conexion es segura y los datos estan encriptados.&quot;
                   </p>
                </div>
              </div>
            </AdminSurface>

            {/* PREVIEW TIPS */}
            <div className="bg-[#fff3f3] border border-[#d71920]/10 p-6 space-y-4">
               <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#d71920]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#d71920]">Preview Tip</p>
               </div>
               <p className="text-xs font-bold text-[#111111] leading-relaxed">
                  Utiliza frases cortas y directas en la bienvenida. El <span className="text-[#d71920]">80%</span> de tus socios lee solo las primeras 3 palabras.
               </p>
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
}
