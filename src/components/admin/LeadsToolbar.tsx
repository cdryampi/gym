"use client";

import { Download, Search, X, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_LEAD_FILTERS, LeadFilters, LeadSort } from "@/lib/data/leads";

interface LeadsToolbarProps {
  filters: LeadFilters;
  availableSources: string[];
  disabledReason?: string;
}

export default function LeadsToolbar({
  filters,
  availableSources,
  disabledReason,
}: LeadsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(() => filters.q);

  const updateParams = useCallback(
    (newParams: Partial<Record<keyof LeadFilters, string>>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === "all" || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      startTransition(() => {
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== filters.q) {
        updateParams({ q: search });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [filters.q, search, updateParams]);

  function handleClear() {
    setSearch("");
    router.push(pathname, { scroll: false });
  }

  const hasFilters =
    filters.q !== DEFAULT_LEAD_FILTERS.q ||
    filters.status !== DEFAULT_LEAD_FILTERS.status ||
    filters.source !== DEFAULT_LEAD_FILTERS.source ||
    filters.sort !== DEFAULT_LEAD_FILTERS.sort;
  const exportQuery = searchParams.toString();
  const exportHref = exportQuery
    ? `/api/dashboard/leads/export?${exportQuery}`
    : "/api/dashboard/leads/export";

  return (
    <div className="space-y-6">
      {/* SEARCH BOX */}
      <div className="space-y-2">
        <label htmlFor="q" className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7a7f87]">
          Buscador Rapido
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#111111]/20" />
          <input
            id="q"
            placeholder="Nombre, email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="flex h-10 w-full border border-black/10 bg-[#fbfbf8] pl-9 pr-4 text-xs font-bold text-[#111111] outline-none focus:bg-white focus:ring-1 focus:ring-[#d71920]/20 transition-all"
          />
        </div>
      </div>

      {/* FILTERS STACK */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="status" className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7a7f87]">
            Estado Operativo
          </label>
          <div className="relative">
            <select
              id="status"
              value={filters.status}
              onChange={(event) => updateParams({ status: event.target.value })}
              className="h-10 w-full appearance-none border border-black/10 bg-white px-3 text-xs font-black uppercase text-[#111111] outline-none focus:ring-1 focus:ring-[#d71920]/20 transition-all"
            >
              <option value="all">Todos los estados</option>
              <option value="new">Nuevos</option>
              <option value="contacted">Contactados</option>
              <option value="closed">Cerrados</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-black/20 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="source" className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7a7f87]">
            Canal de Entrada
          </label>
          <div className="relative">
            <select
              id="source"
              value={filters.source}
              onChange={(event) => updateParams({ source: event.target.value })}
              className="h-10 w-full appearance-none border border-black/10 bg-white px-3 text-xs font-black uppercase text-[#111111] outline-none focus:ring-1 focus:ring-[#d71920]/20 transition-all"
            >
              <option value="all">Cualquier origen</option>
              {availableSources.map((source) => (
                <option key={source} value={source}>
                  {source.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-black/20 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="sort" className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7a7f87]">
            Prioridad de Lista
          </label>
          <div className="relative">
            <select
              id="sort"
              value={filters.sort}
              onChange={(event) => updateParams({ sort: event.target.value as LeadSort })}
              className="h-10 w-full appearance-none border border-black/10 bg-white px-3 text-xs font-black uppercase text-[#111111] outline-none focus:ring-1 focus:ring-[#d71920]/20 transition-all"
            >
              <option value="created_desc">Recientes primero</option>
              <option value="created_asc">Antiguos primero</option>
              <option value="name_asc">Orden alfabetico</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-black/20 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="pt-4 space-y-2">
        <Button
          type="button"
          variant="outline"
          asChild={!disabledReason}
          disabled={Boolean(disabledReason)}
          title={disabledReason ?? "Exporta la vista actual en CSV."}
          className="w-full h-10 bg-white border-black/10 text-[9px] font-black uppercase tracking-[0.2em] text-[#111111] hover:bg-[#111111] hover:text-white transition-all rounded-none"
        >
          {disabledReason ? (
            <span className="flex items-center justify-center gap-2">
              <Download className="h-3 w-3" />
              Exportar Datos
            </span>
          ) : (
            <a href={exportHref} className="flex items-center justify-center gap-2">
              <Download className="h-3 w-3" />
              Exportar Datos
            </a>
          )}
        </Button>

        {hasFilters ? (
          <button
            onClick={handleClear}
            className="w-full py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#d71920] hover:bg-[#d71920]/5 transition-all flex items-center justify-center gap-2"
          >
            <X className="h-3 w-3" />
            Limpiar Filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}
