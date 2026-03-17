import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Minus,
  Plus,
  Store,
  TimerReset,
} from "lucide-react";

import ProductGallery from "@/components/marketing/ProductGallery";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/types";
import {
  formatProductPrice,
  getProductStockMeta,
  productCategoryLabels,
} from "@/lib/data/products";

interface ProductDetailProps {
  product: Product;
}

function getPrimaryOption(product: Product) {
  return product.options?.[0];
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

  return "Tu pedido queda reservado para recepcion y confirmacion directa con el club.";
}

export default function ProductDetail({ product }: Readonly<ProductDetailProps>) {
  const stockMeta = getProductStockMeta(product.stock_status);
  const primaryOption = getPrimaryOption(product);
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

          {primaryOption ? (
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#111111]">
                {primaryOption.title}
              </p>
              <div className="flex flex-wrap gap-2">
                {primaryOption.values.map((value, index) => (
                  <span
                    key={`${primaryOption.id}-${value}`}
                    className={`inline-flex min-h-11 items-center border px-5 text-[11px] font-bold uppercase tracking-wider ${
                      index === 0
                        ? "border-[#d71920] bg-white text-[#d71920]"
                        : "border-[#d5d9e2] bg-white text-[#111111]"
                    }`}
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#111111]">
              Cantidad
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="inline-flex h-12 items-center border border-[#111111] bg-white">
                <button
                  type="button"
                  aria-label="Reducir cantidad"
                  className="flex h-full w-12 items-center justify-center text-[#111111]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex h-full min-w-12 items-center justify-center border-x border-[#111111] px-4 text-sm font-semibold text-[#111111]">
                  1
                </span>
                <button
                  type="button"
                  aria-label="Aumentar cantidad"
                  className="flex h-full w-12 items-center justify-center text-[#111111]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                type="button"
                className="h-12 rounded-none bg-[#d71920] px-8 text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:bg-[#bf161c]"
              >
                {product.cta_label}
              </Button>
            </div>
          </div>

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
