"use client";

import Link from "next/link";
import { X, Filter, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  buildShopHref,
  countProductsByCategory,
  productCategoryLabels,
  productStockStatusLabels,
  type ProductCatalogueFilters,
} from "@/lib/data/products";
import { productStockStatuses, type Product } from "@/data/types";
import { cn } from "@/lib/utils";

interface ProductFiltersProps {
  filters: ProductCatalogueFilters;
  allProducts: Product[];
}

function FilterLink({
  href,
  active,
  label,
  count,
}: Readonly<{
  href: string;
  active: boolean;
  label: string;
  count?: number;
}>) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between gap-4 border p-4 transition-all duration-200",
        active
          ? "border-[#111111] bg-[#111111] text-white shadow-lg translate-x-1"
          : "border-black/5 bg-white text-[#4b5563] hover:border-black/20 hover:bg-[#fbfbf8]"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-1.5 w-1.5 rounded-none transition-all",
          active ? "bg-[#d71920] scale-125" : "bg-black/20 group-hover:bg-[#d71920]"
        )} />
        <span className={cn(
          "text-[11px] font-black uppercase tracking-widest",
          active ? "text-white" : "text-[#575C66] group-hover:text-[#111111]"
        )}>
          {label}
        </span>
      </div>
      {typeof count === "number" ? (
        <span className={cn(
          "text-[10px] font-bold font-mono",
          active ? "text-white/50" : "text-black/50"
        )}>
          {count.toString().padStart(2, '0')}
        </span>
      ) : (
        <ChevronRight className={cn(
          "h-3 w-3 transition-transform",
          active ? "text-white/50 translate-x-1" : "text-black/40 group-hover:translate-x-1"
        )} />
      )}
    </Link>
  );
}

function ActiveFilterChips({ filters }: Readonly<{ filters: ProductCatalogueFilters }>) {
  const chips = [];

  if (filters.category !== "all") {
    chips.push({
      label: productCategoryLabels[filters.category],
      href: buildShopHref(filters, { category: "all" }),
    });
  }

  if (filters.featuredOnly) {
    chips.push({
      label: "Premium",
      href: buildShopHref(filters, { featuredOnly: false }),
    });
  }

  if (filters.availability !== "all") {
    chips.push({
      label: productStockStatusLabels[filters.availability],
      href: buildShopHref(filters, { availability: "all" }),
    });
  }

  if (filters.query) {
    chips.push({
      label: `"${filters.query}"`,
      href: buildShopHref(filters, { query: "" }),
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111111]">Filtros Activos</p>
         <Link href="/tienda" className="text-[9px] font-black uppercase text-[#d71920] hover:underline underline-offset-4">Limpiar</Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link key={chip.label} href={chip.href} className="group">
            <Badge className="rounded-none border-black/10 bg-white text-[#111111] hover:bg-[#111111] hover:text-white transition-all py-1 px-3 flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest">{chip.label}</span>
              <X className="h-2.5 w-2.5 text-black/20 group-hover:text-white/40" />
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ProductFilters({
  filters,
  allProducts,
}: Readonly<ProductFiltersProps>) {
  const categoryCounts = countProductsByCategory(allProducts);

  const hasActiveFilters = filters.category !== "all" || filters.featuredOnly || filters.availability !== "all" || filters.query;

  const content = (
    <div className="space-y-10">
      
      {hasActiveFilters && (
        <div className="border-b border-black/5 pb-10">
          <ActiveFilterChips filters={filters} />
        </div>
      )}

      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#575C66] px-1">
          Categoría
        </p>
        <div className="grid gap-2">
          <FilterLink
            href={buildShopHref(filters, { category: "all" })}
            active={filters.category === "all"}
            label="Catálogo Completo"
            count={allProducts.length}
          />
          {Object.entries(productCategoryLabels).map(([category, label]) => (
            <FilterLink
              key={category}
              href={buildShopHref(filters, { category: category as keyof typeof productCategoryLabels })}
              active={filters.category === category}
              label={label}
              count={categoryCounts[category as keyof typeof categoryCounts]}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#575C66] px-1">
          Disponibilidad
        </p>
        <div className="grid gap-2">
          <FilterLink
            href={buildShopHref(filters, { availability: "all" })}
            active={filters.availability === "all"}
            label="Cualquier Estado"
          />
          {productStockStatuses.map((status) => (
            <FilterLink
              key={status}
              href={buildShopHref(filters, { availability: status })}
              active={filters.availability === status}
              label={productStockStatusLabels[status]}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#575C66] px-1">
          Selección Especial
        </p>
        <div className="grid gap-2">
          <FilterLink
            href={buildShopHref(filters, { featuredOnly: !filters.featuredOnly })}
            active={filters.featuredOnly}
            label="Productos Premium"
          />
        </div>
      </div>

      <div className="pt-6 border-t border-black/5">
        <div className="bg-[#fbfbf8] p-6 border border-black/5">
           <p className="text-[10px] font-bold text-[#575C66] leading-relaxed uppercase tracking-wider">
              Recogida local disponible en todos los productos. Consulta disponibilidad en el club.
           </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <details className="overflow-hidden border border-black/10 bg-white shadow-xl lg:hidden group">
        <summary className="flex cursor-pointer items-center justify-between px-8 py-6 transition hover:bg-[#fbfbf8]">
          <div className="flex items-center gap-4">
             <Filter className="h-4 w-4 text-[#d71920]" />
             <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#111111]">
               Filtrar Catálogo
             </span>
          </div>
          <div className="h-2 w-2 rounded-full bg-[#d71920] group-open:rotate-180 transition-transform" />
        </summary>
        <div className="border-t border-black/5 p-8 bg-white">{content}</div>
      </details>

      <aside className="hidden lg:block lg:sticky lg:top-36 lg:h-fit">
        <div className="bg-white border border-black/10 p-10 shadow-2xl">
           <div className="mb-10 flex items-center gap-4">
              <div className="h-10 w-10 bg-[#111111] flex items-center justify-center">
                 <Filter className="h-5 w-5 text-[#d71920]" />
              </div>
              <p className="font-display text-2xl font-black uppercase tracking-tight italic">Filtros</p>
           </div>
           {content}
        </div>
      </aside>
    </>
  );
}
