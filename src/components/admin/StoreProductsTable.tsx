"use client";

import Link from "next/link";

import type { StoreDashboardProduct } from "@/lib/data/store";
import { formatProductPrice, productStockStatusLabels } from "@/lib/data/products";
import { Badge } from "@/components/ui/badge";
import { deleteStoreProduct } from "@/app/(admin)/dashboard/tienda/actions";

import AdminSurface from "./AdminSurface";
import DeleteStoreItemButton from "./DeleteStoreItemButton";

interface StoreProductsTableProps {
  products: StoreDashboardProduct[];
}

function getStockVariant(stockStatus: StoreDashboardProduct["stock_status"]) {
  switch (stockStatus) {
    case "in_stock":
      return "success" as const;
    case "low_stock":
      return "warning" as const;
    case "coming_soon":
    case "out_of_stock":
    default:
      return "muted" as const;
  }
}

export default function StoreProductsTable({ products }: Readonly<StoreProductsTableProps>) {
  if (products.length === 0) {
    return (
      <AdminSurface inset className="p-5">
        <p className="text-sm font-semibold text-[#111111]">No hay productos cargados.</p>
        <p className="mt-2 text-sm leading-6 text-[#5f6368]">
          Añade el primer producto para empezar a poblar la tienda interna.
        </p>
      </AdminSurface>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <AdminSurface
          key={product.id}
          inset
          className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.2fr)_180px_130px_auto]"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#111111]">{product.name}</p>
              {product.featured ? <Badge>Destacado</Badge> : null}
              {!product.active ? <Badge variant="warning">Inactivo</Badge> : null}
            </div>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#7a7f87]">
              {product.parent_category_name ?? "Sin raiz"} / {product.category_name ?? "Sin subcategoria"}
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5f6368]">
              {product.short_description}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
              Precio
            </p>
            <p className="mt-2 text-sm font-semibold text-[#111111]">
              {formatProductPrice(product)}
            </p>
            {product.compare_price ? (
              <p className="mt-1 text-xs text-[#9ca3af] line-through">
                {formatProductPrice({
                  price: product.compare_price,
                  currency: product.currency,
                })}
              </p>
            ) : null}
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
              Estado
            </p>
            <div className="mt-2">
              <Badge variant={getStockVariant(product.stock_status)}>
                {productStockStatusLabels[product.stock_status]}
              </Badge>
            </div>
          </div>

          <div className="flex items-start justify-end gap-2">
            <Link
              href={`/dashboard/tienda/productos/${product.id}`}
              className="rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-[#111111] transition hover:border-[#111111] hover:bg-[#111111] hover:text-white"
            >
              Editar
            </Link>
            <DeleteStoreItemButton id={product.id} onDelete={deleteStoreProduct} />
          </div>
        </AdminSurface>
      ))}
    </div>
  );
}
