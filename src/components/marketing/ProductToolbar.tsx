"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import type { ProductCatalogueFilters } from "@/lib/data/products";

interface ProductToolbarProps {
  filters: ProductCatalogueFilters;
  resultsCount: number;
}

const sortLabels = {
  featured: "Destacados",
  price_asc: "Precio ascendente",
  price_desc: "Precio descendente",
  name: "Nombre",
} as const;

export default function ProductToolbar({
  filters,
  resultsCount,
}: Readonly<ProductToolbarProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [localQuery, setLocalQuery] = useState(filters.query);

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`/tienda?${params.toString()}`, { scroll: false });
    });
  }, [router, searchParams, startTransition]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== filters.query) {
        updateParams({ q: localQuery });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localQuery, filters.query, updateParams]);

  return (
    <div className="bg-[#111111] p-6 lg:p-8 shadow-2xl relative overflow-hidden group">
      <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
        
        <div className="shrink-0 space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-none bg-[#d71920]" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70">
               Explorador de Catálogo
             </p>
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-display font-black uppercase tracking-tight text-white italic">
              {resultsCount} {resultsCount === 1 ? "Artículo" : "Artículos"}
            </h3>
            <span className="text-white/40 text-xs">/</span>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
              {filters.query ? `Resultados para "${filters.query}"` : "Disponibles en Sala"}
            </p>
            {isPending && (
              <div className="ml-2 h-3 w-3 animate-spin rounded-none border-2 border-[#d71920] border-t-transparent" />
            )}
          </div>
        </div>

        <div className="grid flex-1 gap-4 sm:grid-cols-[1fr,240px] xl:max-w-3xl">
          <div className="relative group/search">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60 group-focus-within/search:text-[#d71920] transition-colors" />
            <input
              type="search"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Buscar productos, marcas o categorías..."
              className="h-14 w-full border border-white/10 bg-white/5 pl-12 pr-6 text-sm text-white outline-none transition-all focus:border-white/20 focus:bg-white/10 placeholder:text-white/60"
            />
          </div>

          <div className="relative group/sort">
            <select
              defaultValue={filters.sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="h-14 w-full appearance-none border border-white/10 bg-white/5 px-6 pr-12 text-[11px] font-black uppercase tracking-widest text-white outline-none transition-all focus:border-white/20 focus:bg-white/10 cursor-pointer"
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value} className="bg-[#111111] text-white">
                  {label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 h-1.5 w-1.5 -translate-y-1/2 bg-[#d71920] rotate-45" />
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 h-full w-1/4 bg-white/5 -skew-x-12 translate-x-20 pointer-events-none" />
    </div>
  );
}
