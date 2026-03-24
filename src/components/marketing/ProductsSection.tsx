import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCommerceCatalog } from "@/lib/commerce/catalog";
import {
  formatProductPrice,
  formatUsdPrice,
  getFeaturedProducts,
  productCategoryLabels,
} from "@/lib/data/products";

export default async function ProductsSection() {
  const catalog = await getCommerceCatalog();
  const { products } = catalog;
  const featuredProducts = getFeaturedProducts(products, 4);

  return (
    <section id="tienda" className="section-anchor bg-[#f5f5f0] py-24 md:py-32">
      <div className="section-shell">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">Tienda del club</p>
            <h2 className="section-title italic">
              Producto <span className="text-accent">bien elegido</span>, sin ruido
            </h2>
            <p className="section-copy mt-6">
              Suplementos, accesorios y merchandising seleccionados para una operacion local
              clara, simple y coherente con la recogida en el club.
            </p>
          </div>

          <Button asChild variant="outline" className="w-fit">
            <Link href="/tienda">Ver catalogo completo</Link>
          </Button>
        </div>

        {catalog.status === "unavailable" ? (
          <div className="bg-white p-8 text-center shadow-[0_28px_80px_-52px_rgba(17,17,17,0.34)] sm:p-10">
            <p className="text-lg font-semibold text-[#111111]">
              El catalogo de la tienda no esta disponible ahora mismo.
            </p>
            <p className="mt-2 text-sm text-[#5f6368]">
              La web ya no usa datos locales de respaldo. Cuando Medusa vuelva a responder,
              reapareceran aqui los productos destacados.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/tienda">Abrir tienda</Link>
              </Button>
              <Button asChild className="btn-athletic btn-primary">
                <Link href="/#contacto">Hablar con un asesor</Link>
              </Button>
            </div>
          </div>
        ) : featuredProducts.length ? (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <article
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-none bg-white shadow-[0_28px_80px_-52px_rgba(17,17,17,0.34)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_36px_95px_-52px_rgba(17,17,17,0.4)]"
              >
                <Link
                  href={`/tienda/${product.slug}`}
                  className="relative aspect-square overflow-hidden bg-[#f1ece4]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(215,25,32,0.12),transparent_55%)]" />
                  <Image
                    src={product.images[0] ?? "/images/products/product-1.png"}
                    alt={product.name}
                    fill
                    className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>

                <div className="flex flex-1 flex-col p-7">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-accent/70">
                    {productCategoryLabels[product.category]}
                  </p>
                  <h3 className="mt-4 min-h-[56px] font-display text-2xl font-bold uppercase tracking-tight text-foreground">
                    <Link href={`/tienda/${product.slug}`} className="transition hover:text-accent">
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#4b5563]">
                    {product.short_description}
                  </p>
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-[#111111]">
                        {formatProductPrice(product)}
                      </p>
                      {product.paypal_price_usd !== null ? (
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6368]">
                          PayPal: {formatUsdPrice(product.paypal_price_usd)}
                        </p>
                      ) : null}
                    </div>
                    <Button asChild className="btn-athletic btn-primary !h-12 !px-6 !text-xs">
                      <Link href={`/tienda/${product.slug}`}>Ver ficha</Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 text-center shadow-[0_28px_80px_-52px_rgba(17,17,17,0.34)] sm:p-10">
            <p className="text-lg font-semibold text-[#111111]">No hay productos destacados por ahora.</p>
            <p className="mt-2 text-sm text-[#5f6368]">
              Puedes explorar el catalogo completo o pedir recomendacion en contacto.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/tienda">Abrir catalogo</Link>
              </Button>
              <Button asChild className="btn-athletic btn-primary">
                <Link href="/#contacto">Hablar con un asesor</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
