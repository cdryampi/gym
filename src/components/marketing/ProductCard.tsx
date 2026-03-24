import Image from "next/image";
import Link from "next/link";

import ProductBadges from "@/components/marketing/ProductBadges";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/types";
import { formatProductPrice, formatUsdPrice, productCategoryLabels } from "@/lib/data/products";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: Readonly<ProductCardProps>) {
  return (
    <article className="group flex h-full flex-col overflow-hidden border border-[#e3dbd0] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d71920]/35 hover:shadow-[0_24px_60px_-32px_rgba(17,17,17,0.28)]">
      <Link
        href={`/tienda/${product.slug}`}
        className="relative block aspect-[1/0.98] overflow-hidden bg-[linear-gradient(145deg,#f4efe7_0%,#f0e2ca_100%)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(215,25,32,0.06),transparent_58%)]" />
        <Image
          src={product.images[0] ?? "/images/products/product-1.png"}
          alt={product.name}
          fill
          className="object-contain p-10 transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(min-width: 1280px) 24vw, (min-width: 768px) 32vw, 100vw"
        />
        {product.featured ? (
          <div className="absolute left-4 top-4">
            <span className="bg-[#d71920] px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
              Premium
            </span>
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7b7f87]">
            {productCategoryLabels[product.category]}
          </p>
          <div className="space-y-1.5">
            <h3 className="font-display text-[28px] uppercase leading-[1.02] tracking-[0.01em] text-[#111111] transition-colors group-hover:text-[#0f2341]">
              <Link href={`/tienda/${product.slug}`}>{product.name}</Link>
            </h3>
            <div className="space-y-1">
              <p className="font-display text-lg font-bold tracking-tight text-[#d71920]">
                {formatProductPrice(product)}
              </p>
              {product.paypal_price_usd !== null ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6368]">
                  PayPal cobra aprox. {formatUsdPrice(product.paypal_price_usd)}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-[#4b5563] sm:text-sm">
          {product.short_description}
        </p>

        <div className="mt-1">
          <ProductBadges product={product} compact />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#ece5db] pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">
            {product.tags.slice(0, 2).join(" / ")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-none border-[#d5d9e2] px-4 text-[10px] font-bold uppercase tracking-widest text-[#111111] transition-all hover:border-[#111111] hover:bg-[#111111] hover:text-white"
            asChild
          >
            <Link href={`/tienda/${product.slug}`}>Ver mas</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
