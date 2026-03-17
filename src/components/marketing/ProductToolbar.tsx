import { Search } from "lucide-react";

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
  return (
    <div className="border border-black/8 bg-white p-4 shadow-[0_20px_60px_-40px_rgba(17,17,17,0.2)] sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">
            Catálogo
          </p>
          <p className="mt-1 text-xs font-medium text-[#4b5563]">
            {resultsCount} {resultsCount === 1 ? "producto" : "productos"}{" "}
            {filters.query ? `para "${filters.query}"` : "disponibles"}
          </p>
        </div>

        <form className="grid flex-1 gap-2.5 sm:grid-cols-[1fr,200px,auto] xl:max-w-3xl" action="/tienda">
          {filters.category !== "all" ? (
            <input type="hidden" name="categoria" value={filters.category} />
          ) : null}
          {filters.availability !== "all" ? (
            <input type="hidden" name="disponibilidad" value={filters.availability} />
          ) : null}
          {filters.featuredOnly ? (
            <input type="hidden" name="destacados" value="true" />
          ) : null}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="search"
              name="q"
              defaultValue={filters.query}
              placeholder="Buscar..."
              className="h-10 w-full border border-black/8 bg-[#faf8f4] pl-9 pr-4 text-sm text-[#111111] outline-none transition focus:border-[#d71920]/40 focus:bg-white"
            />
          </div>

          <div className="relative">
            <select
              name="sort"
              defaultValue={filters.sort}
              className="h-10 w-full border border-black/8 bg-[#faf8f4] px-4 py-0 text-sm text-[#111111] outline-none transition focus:border-[#d71920]/40 focus:bg-white"
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="h-10 bg-[#111111] px-6 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-[#d71920] active:scale-95"
          >
            Filtrar
          </button>
        </form>
      </div>
    </div>
  );
}
