import Link from "next/link";

import ProductCard from "@/components/marketing/ProductCard";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/types";

interface ProductsGridProps {
  products: Product[];
}

export default function ProductsGrid({ products }: Readonly<ProductsGridProps>) {
  if (products.length === 0) {
    return (
      <div className="rounded-none border border-dashed border-black/12 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(17,17,17,0.35)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b7280]">
          Sin resultados
        </p>
        <h2 className="mt-4 font-display text-4xl uppercase text-[#111111]">
          No hay productos con esos filtros
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#4b5563]">
          Prueba otra búsqueda o limpia los filtros para volver a ver todo el catálogo de Nova
          Forza.
        </p>
        <Button asChild variant="outline" className="mt-8">
          <Link href="/tienda">Limpiar filtros</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
