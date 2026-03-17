import type { Product } from "@/data/types";
import { formatProductPrice, productCategoryLabels, productStockStatusLabels } from "@/lib/data/products";
import { Badge } from "@/components/ui/badge";

import AdminSurface from "./AdminSurface";

interface StoreCatalogTableProps {
  products: Product[];
}

function getStockVariant(stockStatus: Product["stock_status"]) {
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

export default function StoreCatalogTable({ products }: Readonly<StoreCatalogTableProps>) {
  if (products.length === 0) {
    return (
      <AdminSurface inset className="p-5">
        <p className="text-sm font-semibold text-[#111111]">No hay productos visibles.</p>
        <p className="mt-2 text-sm leading-6 text-[#5f6368]">
          Revisa la fuente activa de commerce o el seed del catalogo antes de publicar cambios.
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
          className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.25fr)_160px_140px_120px]"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#111111]">{product.name}</p>
              {product.featured ? <Badge>Destacado</Badge> : null}
              {product.pickup_only ? <Badge variant="muted">Pickup</Badge> : null}
            </div>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
              {product.eyebrow ?? productCategoryLabels[product.category]}
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
                {formatProductPrice({ price: product.compare_price, currency: product.currency })}
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

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
              Assets
            </p>
            <p className="mt-2 text-sm font-semibold text-[#111111]">{product.images.length}</p>
            <p className="mt-1 text-xs text-[#5f6368]">imagenes vinculadas</p>
          </div>
        </AdminSurface>
      ))}
    </div>
  );
}
