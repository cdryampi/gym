import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/admin/DashboardShell";
import SidebarContainer from "@/components/admin/SidebarContainer";
import MobileSidebar from "@/components/admin/MobileSidebar";
import SignOutButton from "@/components/admin/SignOutButton";
import DashboardNotice from "@/components/admin/DashboardNotice";
import { Card } from "@/components/ui/card";
import { ADMIN_LOGIN_PATH } from "@/lib/admin";
import { getDashboardAccessState } from "@/lib/auth";
import { getActiveModules } from "@/lib/data/modules";
import { hasSupabasePublicEnv } from "@/lib/env";
import { getMarketingSnapshot } from "@/lib/supabase/queries";
import { BrandingProvider } from "@/features/admin/branding/components/BrandingProvider";

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

  const [accessState, activeModules, { settings }] = await Promise.all([
    getDashboardAccessState(),
    getActiveModules(),
    getMarketingSnapshot(),
  ]);

  if (!accessState.user) {
    redirect(`${ADMIN_LOGIN_PATH}?next=/dashboard&error=admin-only`);
  }

  if (accessState.accessMode === null) {
    redirect("/mi-cuenta");
  }

  const user = accessState.user;

  return (
    <BrandingProvider initialSettings={settings}>
      <DashboardShell>
        <div className="flex h-screen overflow-hidden bg-[#fbfbf8]">
          {/* SIDEBAR FIJO (LEFT) - Visible solo en XL+ */}
          <SidebarContainer
            activeModules={activeModules}
            isSuperadmin={accessState.accessMode === "superadmin"}
          />

          {/* ÁREA DE CONTENIDO (MAIN SCROLL) */}
          <main className="flex flex-1 flex-col overflow-hidden">
            
            {/* HEADER SUPERIOR (STAY ON TOP) */}
            <header className="z-20 border-b border-black/10 bg-white/80 backdrop-blur-md">
              <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-10">
                <div className="flex items-center gap-3 sm:gap-6">
                  {/* Menu Mobile - Toggle Sidebar */}
                  <MobileSidebar
                    activeModules={activeModules}
                    isSuperadmin={accessState.accessMode === "superadmin"}
                  />
                  
                  <div className="hidden sm:block">
                    <p className="font-bold text-[10px] uppercase tracking-widest text-[#d71920]">Mission Control</p>
                    <h1 className="text-xl font-display font-bold tracking-tight text-[#111111] uppercase">Operacion <span className="text-black/20">/</span> Dashboard</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="hidden border-l border-black/10 pl-6 lg:flex items-center gap-4">
                    <div className="h-8 w-8 bg-[#fbfbf8] border border-black/5 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7a7f87]">Admin Active</p>
                      <p className="text-xs font-bold text-[#111111]">{user.email}</p>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-black/5 mx-1 sm:mx-2 hidden lg:block" />
                  <SignOutButton />
                </div>
              </div>
            </header>

            {/* CONTENIDO DESPLAZABLE */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-10">
              <div className="mx-auto max-w-[1600px] space-y-10">
                {accessState.accessWarning ? (
                  <DashboardNotice
                    message={accessState.accessWarning}
                    tone={accessState.accessMode === "bootstrap" ? "info" : "warning"}
                  />
                ) : null}
                {children}
              </div>
            </div>
          </main>
        </div>
      </DashboardShell>
    </BrandingProvider>
  );
}
