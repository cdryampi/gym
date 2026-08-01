import { Activity, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import DiagnosticsPanel from "@/components/admin/diagnostics/DiagnosticsPanel";
import { Button } from "@/components/ui/button";
import { requireDashboardAccessModes } from "@/lib/auth";
import {
  getPayPalEnv,
  hasFirebaseAdminEnv,
  hasFirebasePublicEnv,
  hasMedusaAdminEnv,
  hasMedusaEnv,
  hasPayPalEnv,
  hasSmtpEnv,
  hasSupabasePublicEnv,
  hasSupabaseSecretKey,
} from "@/lib/env";

export default async function DiagnosticsPage() {
  const accessState = await requireDashboardAccessModes(["admin", "superadmin", "local"]);
  const isSuperadmin = accessState.accessMode === "superadmin";

  const initialStatus = {
    supabase: {
      configured: hasSupabasePublicEnv(),
      serviceRole: hasSupabaseSecretKey(),
    },
    firebase: {
      public: hasFirebasePublicEnv(),
      admin: hasFirebaseAdminEnv(),
    },
    medusa: {
      storefront: hasMedusaEnv(),
      admin: hasMedusaAdminEnv(),
    },
    smtp: {
      configured: hasSmtpEnv(),
    },
    paypal: {
      configured: hasPayPalEnv(),
      environment: hasPayPalEnv() ? getPayPalEnv().environment : null,
    },
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 border-b border-black/5 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <DashboardPageHeader
          title="DIAGNOSTICO"
          description="Validacion de conectividad y salud de servicios externos y APIs."
          icon={Activity}
          eyebrow="System Health"
          className="pb-0"
        />

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-10 text-[10px] font-black uppercase tracking-widest"
          >
            <Link href="/dashboard/developer" className="flex items-center gap-2">
              <ArrowLeft className="h-3 w-3" />
              Volver a Developer
            </Link>
          </Button>

          <div className="flex items-center gap-4 bg-[#111111] p-3 text-white shadow-xl">
            <ShieldCheck className="h-5 w-5 text-[#d71920]" />
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
                Acceso
              </p>
              <p className="text-xs font-black uppercase tracking-tight text-white">
                {isSuperadmin ? "Superadmin" : "Admin"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl">
        <p className="mb-8 text-sm font-medium leading-relaxed text-black/60">
          Esta consola permite verificar que las variables de entorno esten correctamente cargadas
          y que los servicios externos (Supabase, Firebase, Medusa) respondan correctamente.
          Las pruebas no realizan cambios destructivos.
        </p>

        {!isSuperadmin ? (
          <p className="mb-8 text-sm font-medium leading-relaxed text-amber-700">
            Acceso admin en modo lectura. Puedes revisar configuracion base, pero solo superadmin
            puede ejecutar pruebas activas desde esta consola.
          </p>
        ) : null}

        <DiagnosticsPanel initialStatus={initialStatus} canRunChecks={isSuperadmin} />
      </div>

      <div className="mt-12 rounded-none border border-black/5 bg-black/[0.02] p-6">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">
          Seguridad y Privacidad
        </h4>
        <p className="mt-3 text-xs font-medium leading-relaxed text-black/50">
          Nunca compartas capturas de pantalla de esta pagina si contienen mensajes de error
          que puedan revelar rutas internas o detalles de infraestructura. Los secretos (keys)
          nunca se muestran en la interfaz por diseno.
        </p>
      </div>
    </div>
  );
}
