import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ProductCard from "@/components/marketing/ProductCard";
import ProductDetail from "@/components/marketing/ProductDetail";
import { getCommerceCatalog, getCommerceProductBySlug } from "@/lib/commerce/catalog";
import {
  getActiveProducts,
  getRelatedProducts,
  productCategoryLabels,
} from "@/lib/data/products";

export const revalidate = 60;

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const { products } = await getCommerceCatalog();
  return getActiveProducts(products).map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: Readonly<ProductDetailPageProps>): Promise<Metadata> {
  const { slug } = await params;
  const snapshot = await getCommerceProductBySlug(slug);
  const product = snapshot.product;

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  return {
    title: `${product.name} en tienda`,
    description: product.short_description,
    alternates: {
      canonical: `/tienda/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | Nova Forza`,
      description: product.short_description,
      url: `/tienda/${product.slug}`,
      images: product.images[0] ? [{ url: product.images[0], alt: product.name }] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: Readonly<ProductDetailPageProps>) {
  const { slug } = await params;
  const [productSnapshot, catalog] = await Promise.all([
    getCommerceProductBySlug(slug),
    getCommerceCatalog(),
  ]);
  const product = productSnapshot.product;

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(catalog.products, product, 3);

  return (
    <>
      {productSnapshot.warning ? (
        <div className="section-shell pt-8">
          <div className="rounded-none border border-amber-300/70 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold uppercase tracking-[0.18em]">Estado commerce</p>
            <p className="mt-2">
              Fuente activa: <span className="font-semibold">{productSnapshot.source}</span>.{" "}
              {productSnapshot.warning}
            </p>
          </div>
        </div>
      ) : null}

      <ProductDetail product={product} />

      <section className="section-shell border-t border-black/8 py-12 md:py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
              Completar tu entrenamiento
            </p>
            <h2 className="mt-3 font-display text-4xl uppercase leading-none text-[#111111] sm:text-5xl">
              Mas productos de {productCategoryLabels[product.category]}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4b5563]">
              Seleccion premium para acompanar tu rutina y mantener una navegacion clara entre
              suplementos, accesorios y merchandising.
            </p>
          </div>
          <Link
            href={`/tienda?categoria=${product.category}`}
            className="text-sm font-semibold uppercase tracking-[0.18em] text-[#111111] transition hover:text-[#d71920]"
          >
            Ver toda la categoria
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {relatedProducts.map((relatedProduct) => (
            <ProductCard key={relatedProduct.id} product={relatedProduct} />
          ))}
        </div>
      </section>
    </>
  );
}
