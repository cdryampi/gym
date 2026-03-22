import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Store,
  TimerReset,
} from "lucide-react";

import ProductPurchasePanel from "@/components/cart/ProductPurchasePanel";
import ProductGallery from "@/components/marketing/ProductGallery";
import type { Product } from "@/data/types";
import {
  formatProductPrice,
  getProductStockMeta,
  productCategoryLabels,
} from "@/lib/data/products";

interface ProductDetailProps {
  product: Product;
}

function getPickupHeading(product: Product) {
  if (product.pickup_summary) {
    return product.pickup_summary;
  }

  if (product.pickup_only) {
    return "Recogida en Nova Forza Gym";
  }

  return "Consulta disponibilidad";
}

function getPickupCopy(product: Product) {
  if (product.pickup_eta) {
    return product.pickup_eta;
  }

  if (product.pickup_note) {
    return product.pickup_note;
  }

  return "Tu pedido queda reservado para recepción y confirmación directa con el club.";
}

export default function ProductDetail({ product }: Readonly<ProductDetailProps>) {
  const stockMeta = getProductStockMeta(product.stock_status);
  const comparePrice = product.compare_price ?? null;
  const showComparePrice = comparePrice !== null && comparePrice > product.price;
  const benefitItems = product.benefits?.length ? product.benefits : product.highlights;
  const usageItems = product.usage_steps?.length
    ? product.usage_steps
    : ["Consulta al equipo del club para encajar este producto en tu rutina."];
  const specificationItems =
    product.specifications?.length
      ? product.specifications
      : [
          { label: "Categoria", value: productCategoryLabels[product.category] },
          { label: "Estado", value: stockMeta.label },
          { label: "Recogida", value: product.pickup_only ? "En local" : "Segun disponibilidad" },
        ];

  return (
    <section className="section-shell py-6 md:py-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex flex-wrap items-center gap-2 text-[10px] font-medium text-[#8a867f]"
      >
        <Link href="/" className="transition hover:text-[#d71920]">
          Inicio
        </Link>
        <span>&gt;</span>
        <Link href="/tienda" className="transition hover:text-[#d71920]">
          Tienda
        </Link>
        <span>&gt;</span>
        <Link
          href={`/tienda?categoria=${product.category}`}
          className="transition hover:text-[#d71920]"
        >
          {productCategoryLabels[product.category]}
        </Link>
        <span>&gt;</span>
        <span className="font-semibold text-[#111111]">{product.name}</span>
      </nav>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.98fr)] xl:items-start">
        <ProductGallery name={product.name} images={product.images} />

        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#d71920]">
              {product.eyebrow ?? "Suplemento de elite"}
            </p>
            <div className="max-w-xl space-y-4">
              <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.92] tracking-[0.01em] text-[#0f2341] sm:text-5xl">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                <p className="font-display text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
                  {formatProductPrice(product)}
                </p>
                {showComparePrice ? (
                  <p className="text-sm font-semibold text-[#9ca3af] line-through">
                    {formatProductPrice({
                      price: comparePrice,
                      currency: product.currency,
                    })}
                  </p>
                ) : null}
                {product.discount_label ? (
                  <span className="bg-[#f9d7d9] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#d71920]">
                    {product.discount_label}
                  </span>
                ) : null}
              </div>

              <p className="max-w-2xl text-[15px] leading-7 text-[#4b5563]">
                {product.description}
              </p>
            </div>
          </div>

          <ProductPurchasePanel product={product} />

          <div className="border border-black/8 bg-[#F7F4EF] p-5">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 bg-white p-2.5 text-[#d71920] shadow-sm">
                <Store className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-bold uppercase tracking-wide text-[#111111]">{getPickupHeading(product)}</p>
                <p className="max-w-md text-[13px] leading-relaxed text-[#5b6472]">{getPickupCopy(product)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 border-t border-[#ddd5ca] pt-6 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#d71920]" />
                <h2 className="font-display text-2xl uppercase text-[#111111]">Beneficios</h2>
              </div>
              <ul className="space-y-3 border-t border-[#ddd5ca] pt-4 text-sm leading-6 text-[#5b6472]">
                {benefitItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#d71920]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TimerReset className="h-4 w-4 text-[#d71920]" />
                <h2 className="font-display text-2xl uppercase text-[#111111]">Como usar</h2>
              </div>
              <div className="border-t border-[#ddd5ca] pt-4 text-sm leading-6 text-[#5b6472]">
                {usageItems.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#d71920]" />
                <h2 className="font-display text-2xl uppercase text-[#111111]">
                  Especificaciones
                </h2>
              </div>
              <dl className="space-y-3 border-t border-[#ddd5ca] pt-4 text-sm">
                {specificationItems.map((item) => (
                  <div
                    key={`${item.label}-${item.value}`}
                    className="flex items-start justify-between gap-4"
                  >
                    <dt className="text-[#98a1af]">{item.label}:</dt>
                    <dd className="text-right font-medium text-[#111111]">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[#ddd5ca] pt-4">
            <span className="border border-[#ddd5ca] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#111111]">
              {stockMeta.label}
            </span>
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="border border-[#ddd5ca] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7280]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
