"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard/tienda", label: "Catalogo" },
  { href: "/dashboard/tienda/categorias", label: "Categorias" },
  { href: "/dashboard/tienda/productos", label: "Productos" },
];

export default function StoreDashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-semibold text-[#5f6368] transition hover:border-[#d71920]/20 hover:text-[#111111]",
              isActive && "border-[#d71920]/20 bg-[#fff3f3] text-[#111111]",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
