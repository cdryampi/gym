"use client";

import { BarChart3, Building, Globe, Settings2, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import AdminSurface from "./AdminSurface";

const links = [
  { href: "/dashboard", label: "Inicio", icon: BarChart3 },
  { href: "/dashboard/leads", label: "Contactos", icon: Users },
  { href: "/dashboard/tienda", label: "Tienda", icon: ShoppingBag },
  { href: "/dashboard/web", label: "Diseno Web", icon: Globe },
  { href: "/dashboard/info", label: "Datos del Gym", icon: Building },
  { href: "/dashboard/advanced", label: "Ajustes Internos", icon: Settings2 },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <AdminSurface className="w-full p-4 lg:sticky lg:top-6 lg:w-72">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-black/8 pb-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#d71920]">
            Nova Forza
          </p>
          <p className="mt-2 text-sm text-[#5f6368]">
            Panel limpio para operar leads, tienda, contenido y ajustes.
          </p>
        </div>
        <Badge variant="muted">admin</Badge>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-fit items-center gap-3 rounded-none border border-transparent px-3.5 py-3 text-sm text-[#5f6368] transition-colors hover:border-black/8 hover:bg-[#faf8f2] hover:text-[#111111] lg:min-w-0",
                isActive && "border-[#d71920]/12 bg-[#fff3f3] text-[#111111]",
              )}
            >
              <Icon className={cn("h-4 w-4 text-[#8c9198]", isActive && "text-[#d71920]")} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </AdminSurface>
  );
}
