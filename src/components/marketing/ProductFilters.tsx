import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  buildShopHref,
  countProductsByCategory,
  productCategoryLabels,
  productStockStatusLabels,
  type ProductCatalogueFilters,
} from "@/lib/data/products";
import { productStockStatuses, type Product } from "@/data/types";

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
      className={`flex items-center justify-between gap-3 border px-4 py-3 text-sm transition ${
        active
          ? "border-[#d71920]/25 bg-[#fff5f5] text-[#111111]"
          : "border-black/8 bg-[#faf8f4] text-[#4b5563] hover:border-[#d71920]/20 hover:bg-white"
      }`}
    >
      <span className="font-medium">{label}</span>
      {typeof count === "number" ? (
        <span className="text-xs uppercase tracking-[0.18em] text-[#6b7280]">{count}</span>
      ) : null}
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
      label: "Solo destacados",
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
      label: `Búsqueda: ${filters.query}`,
      href: buildShopHref(filters, { query: "" }),
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Link key={chip.label} href={chip.href}>
          <Badge variant="muted" className="hover:border-[#d71920]/20 hover:bg-[#fff5f5]">
            {chip.label}
          </Badge>
        </Link>
      ))}
      <Link href="/tienda">
        <Badge variant="default">Limpiar todo</Badge>
      </Link>
    </div>
  );
}

export default function ProductFilters({
  filters,
  allProducts,
}: Readonly<ProductFiltersProps>) {
  const categoryCounts = countProductsByCategory(allProducts);

  const content = (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
          Categoría
        </p>
        <div className="mt-3 space-y-2">
          <FilterLink
            href={buildShopHref(filters, { category: "all" })}
            active={filters.category === "all"}
            label="Todo el catálogo"
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

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
          Disponibilidad
        </p>
        <div className="mt-3 space-y-2">
          <FilterLink
            href={buildShopHref(filters, { availability: "all" })}
            active={filters.availability === "all"}
            label="Cualquier estado"
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

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
          Selección
        </p>
        <div className="mt-3 space-y-2">
          <FilterLink
            href={buildShopHref(filters, { featuredOnly: !filters.featuredOnly })}
            active={filters.featuredOnly}
            label="Solo destacados"
          />
        </div>
      </div>

      <div className="border-t border-black/8 pt-6">
        <ActiveFilterChips filters={filters} />
      </div>
    </div>
  );

  return (
    <>
      <details className="overflow-hidden border border-black/8 bg-white shadow-sm lg:hidden">
        <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-[#111111] transition hover:bg-[#faf8f4]">
          <span>Filtros de tienda</span>
          <div className="h-1.5 w-1.5 rounded-full bg-[#d71920]" />
        </summary>
        <div className="border-t border-black/5 p-6">{content}</div>
      </details>

      <aside className="hidden border border-black/8 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(17,17,17,0.35)] lg:block lg:sticky lg:top-36 lg:h-fit">
        <div className="mb-6">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-[#111111]">
            Selección
          </p>
          <div className="mt-2 h-0.5 w-6 bg-[#d71920]" />
        </div>
        {content}
      </aside>
    </>
  );
}
