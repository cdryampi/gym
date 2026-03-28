"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_LEAD_FILTERS, LeadFilters, LeadSort } from "@/lib/data/leads";

import AdminSurface from "./AdminSurface";

interface LeadsToolbarProps {
  filters: LeadFilters;
  availableSources: string[];
}

export default function LeadsToolbar({ filters, availableSources }: LeadsToolbarProps) {
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

  return (
    <AdminSurface inset className="flex flex-col gap-4 p-4 md:flex-row md:items-end">
      <div className="flex-1 space-y-1.5">
        <label htmlFor="q" className="text-xs font-medium text-[#5f6368]">
          Buscar
        </label>
        <p className="text-xs leading-5 text-[#7a7f87]">
          Filtra por nombre, email o teléfono sin salir de la bandeja.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a7f87]" />
          <Input
            id="q"
            placeholder="Nombre, email o teléfono..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:flex md:items-end">
        <div className="min-w-[140px] space-y-1.5">
          <label htmlFor="status" className="text-xs font-medium text-[#5f6368]">
            Estado
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(event) => updateParams({ status: event.target.value })}
            className="h-11 w-full rounded-none border border-black/10 bg-white px-3 text-sm text-[#111111] outline-none transition-colors focus:border-[#d71920]/30 focus-visible:ring-2 focus-visible:ring-[#d71920]/20"
          >
            <option value="all">Todos</option>
            <option value="new">Nuevo</option>
            <option value="contacted">Contactado</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>

        <div className="min-w-[140px] space-y-1.5">
          <label htmlFor="source" className="text-xs font-medium text-[#5f6368]">
            Origen
          </label>
          <select
            id="source"
            value={filters.source}
            onChange={(event) => updateParams({ source: event.target.value })}
            className="h-11 w-full rounded-none border border-black/10 bg-white px-3 text-sm text-[#111111] outline-none transition-colors focus:border-[#d71920]/30 focus-visible:ring-2 focus-visible:ring-[#d71920]/20"
          >
            <option value="all">Todos</option>
            {availableSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[140px] space-y-1.5">
          <label htmlFor="sort" className="text-xs font-medium text-[#5f6368]">
            Orden
          </label>
          <select
            id="sort"
            value={filters.sort}
            onChange={(event) => updateParams({ sort: event.target.value as LeadSort })}
            className="h-11 w-full rounded-none border border-black/10 bg-white px-3 text-sm text-[#111111] outline-none transition-colors focus:border-[#d71920]/30 focus-visible:ring-2 focus-visible:ring-[#d71920]/20"
          >
            <option value="created_desc">Más recientes primero</option>
            <option value="created_asc">Más antiguos primero</option>
            <option value="name_asc">Nombre A-Z</option>
          </select>
        </div>
      </div>

      {hasFilters ? (
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          className="h-11 border-dashed border-[#7a7f87]/30 font-medium tracking-normal text-[#5f6368] hover:text-[#d71920]"
        >
          <X className="h-4 w-4" />
          Limpiar
        </Button>
      ) : null}
    </AdminSurface>
  );
}
