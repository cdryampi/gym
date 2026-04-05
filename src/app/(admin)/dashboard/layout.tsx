import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

import DashboardSidebar from "@/components/admin/DashboardSidebar";
import SignOutButton from "@/components/admin/SignOutButton";
import DashboardNotice from "@/components/admin/DashboardNotice";
import { Card } from "@/components/ui/card";
import { ADMIN_LOGIN_PATH } from "@/lib/admin";
import { getDashboardAccessState } from "@/lib/auth";
import { hasSupabasePublicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  if (!hasSupabasePublicEnv()) {
    return (
      <div className="min-h-screen bg-[#fbfbf8] px-4 py-10 sm:px-6 xl:px-8 2xl:px-10">
        <Card className="p-6 text-sm text-[#5f6368]">
          Configura Supabase para usar el backoffice interno.
        </Card>
      </div>
    );
  }

  const accessState = await getDashboardAccessState();

  if (!accessState.user) {
    redirect(`${ADMIN_LOGIN_PATH}?next=/dashboard&error=admin-only`);
  }

  const user = accessState.user;

  return (
    <div className="flex h-screen overflow-hidden bg-[#fbfbf8]">
      {/* SIDEBAR FIJO (LEFT) */}
      <aside className="hidden h-screen w-[304px] shrink-0 border-r border-white/5 bg-[#111111] xl:block 2xl:w-[320px]">
        <DashboardSidebar />
      </aside>

      {/* ÁREA DE CONTENIDO (MAIN SCROLL) */}
      <main className="flex flex-1 flex-col overflow-hidden">
        
        {/* HEADER SUPERIOR (STAY ON TOP) */}
        <header className="z-20 border-b border-black/10 bg-white/80 backdrop-blur-md">
          <div className="flex h-20 items-center justify-between px-6 lg:px-10">
            <div className="flex items-center gap-6">
              {/* Logo visible solo en mobile si es necesario, aqui para consistencia */}
              <div className="xl:hidden relative h-10 w-10 bg-black p-1">
                 <Image src="/images/logo/logo-trans.webp" alt="Logo" fill className="object-contain" />
              </div>
              <div className="hidden sm:block">
                <p className="font-black text-[9px] uppercase tracking-[0.3em] text-[#d71920]">Mission Control</p>
                <h1 className="text-xl font-display font-black tracking-tighter text-[#111111] uppercase">Operacion <span className="text-black/20">/</span> Sin Ruido</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden border-l border-black/10 pl-6 lg:flex items-center gap-4">
                <div className="h-8 w-8 bg-[#fbfbf8] border border-black/5 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-[#7a7f87]">Admin Active</p>
                  <p className="text-[11px] font-bold text-[#111111]">{user.email}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-black/5 mx-2" />
              <SignOutButton />
            </div>
          </div>
        </header>

        {/* CONTENIDO DESPLAZABLE */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
          <div className="mx-auto max-w-[1600px] space-y-10">
            {accessState.accessWarning ? (
              <DashboardNotice
                message={accessState.accessWarning}
                tone={accessState.accessMode === "bootstrap" ? "muted" : "warning"}
              />
            ) : null}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
