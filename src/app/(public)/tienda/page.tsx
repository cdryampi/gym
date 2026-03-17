import type { Metadata } from "next";

import ProductFilters from "@/components/marketing/ProductFilters";
import ProductsGrid from "@/components/marketing/ProductsGrid";
import ProductToolbar from "@/components/marketing/ProductToolbar";
import { getCommerceCatalog } from "@/lib/commerce/catalog";
import {
  getActiveProducts,
  getAllProducts,
  normalizeProductFilters,
  type ProductSearchParamsInput,
} from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Tienda del gimnasio",
  description:
    "Catálogo de suplementos, accesorios y merchandising de Nova Forza. Consulta productos destacados, disponibilidad y recogida en local.",
};

export const revalidate = 60;

interface ShopPageProps {
  searchParams: Promise<ProductSearchParamsInput>;
}

export default async function ShopPage({ searchParams }: Readonly<ShopPageProps>) {
  const resolvedSearchParams = await searchParams;
  const filters = normalizeProductFilters(resolvedSearchParams);
  const catalog = await getCommerceCatalog();
  const allProducts = getActiveProducts(catalog.products);
  const filteredProducts = getAllProducts(catalog.products, filters);

  return (
    <>
      <section className="overflow-hidden border-b border-black/8 bg-[#18181b] text-white">
        <div className="section-shell relative py-20 lg:py-32">
          {/* Visual Anchor: Branded Gradient and pattern */}
          <div className="absolute inset-y-0 right-[-5%] hidden w-[50%] bg-[radial-gradient(circle_at_center,rgba(215,25,32,0.18),transparent_70%)] lg:block">
            <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:40px_40px]" />
          </div>

          <div className="relative max-w-4xl">
            <p className="inline-block rounded-sm bg-[#d71920] px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white">
              Nova Forza Equipt.
            </p>
            <h1 className="mt-8 font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-[0.02em] sm:text-7xl lg:text-9xl italic">
              Potencia tu <br />
              <span className="text-[#d71920]">Rendimiento</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70">
              Selección exclusiva de suplementación técnica, accesorios de fuerza y merchandising oficial. 
              Calidad probada en sala para quienes buscan resultados reales.
            </p>
          </div>
        </div>
      </section>

      <section className="section-shell py-10 md:py-14">
        {catalog.warning ? (
          <div className="mb-6 rounded-none border border-amber-300/70 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold uppercase tracking-[0.18em]">Estado commerce</p>
            <p className="mt-2">
              Fuente activa: <span className="font-semibold">{catalog.source}</span>. {catalog.warning}
            </p>
          </div>
        ) : null}

        <ProductToolbar filters={filters} resultsCount={filteredProducts.length} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start">
          <ProductFilters filters={filters} allProducts={allProducts} />
          <ProductsGrid products={filteredProducts} />
        </div>
      </section>
    </>
  );
}
