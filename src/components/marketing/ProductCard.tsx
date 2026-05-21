"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import ProductBadges from "@/components/marketing/ProductBadges";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/types";
import { formatProductPrice, productCategoryLabels } from "@/lib/data/products";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: Readonly<ProductCardProps>) {
  const primaryImage = product.images[0] ?? null;

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group flex h-full flex-col overflow-hidden border border-black/5 bg-white transition-all duration-500 hover:shadow-[0_32px_80px_-40px_rgba(17,17,17,0.3)] relative rounded-[var(--radius-base)]"
    >
      <Link
        href={`/tienda/${product.slug}`}
        className="relative block aspect-[1/0.9] overflow-hidden bg-[#fbfbf8]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(215,25,32,0.03),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-contain p-12 transition-all duration-700 ease-out group-hover:scale-110 group-hover:-rotate-2"
            sizes="(min-width: 1280px) 24vw, (min-width: 768px) 32vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-black/5">
            <span className="font-display text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              Imagen no disp.
            </span>
          </div>
        )}
        
        {/* BADGES POSICIONADOS */}
        <div className="absolute left-6 top-6 flex flex-col gap-2">
            {product.featured && (
              <span className="bg-[#d71920] px-3 py-1 font-black text-[9px] uppercase tracking-widest text-white shadow-xl rounded-[var(--radius-base)]">
                Premium
              </span>
            )}
           <ProductBadges product={product} compact className="flex-col items-start gap-1" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-8 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-1 w-1 bg-[#d71920]" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#575C66]">
               {productCategoryLabels[product.category]}
             </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-display text-2xl sm:text-3xl font-black uppercase leading-none tracking-tighter text-[#111111] italic group-hover:text-[#d71920] transition-colors">
              <Link href={`/tienda/${product.slug}`}>{product.name}</Link>
            </h3>
            <div className="flex items-baseline gap-3">
              <p className="font-display text-2xl font-black text-[#111111]">
                {formatProductPrice(product)}
              </p>
            </div>
          </div>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-[#5f6368] font-medium">
          {product.short_description}
        </p>

        <div className="mt-auto pt-8 border-t border-black/5 flex items-center justify-between">
          <div className="flex flex-col">
             <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mb-1">Tags</p>
             <p className="text-[10px] font-bold uppercase tracking-tight text-[#575C66]">
               {product.tags.slice(0, 1).join("") || "General"}
             </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-8 rounded-[var(--radius-base)] border-black/10 bg-white text-[#111111] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#111111] hover:text-white transition-all shadow-sm"
            asChild
          >
            <Link href={`/tienda/${product.slug}`}>Ver mas</Link>
          </Button>
        </div>
      </div>
      
      {/* DECORATIVE ELEMENT */}
      <div className="absolute bottom-0 right-0 h-1 w-0 bg-[#d71920] group-hover:w-full transition-all duration-700" />
    </motion.article>
  );
}
