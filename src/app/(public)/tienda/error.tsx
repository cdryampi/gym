"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ShopError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <div className="section-shell flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-[#d71920]">
        Error de catálogo
      </p>
      <h1 className="mt-6 font-display text-4xl font-extrabold uppercase leading-[0.9] text-[#111111] sm:text-6xl italic">
        No pudimos cargar <br /> la tienda
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#6b7280]">
        {error.message || "Ha fallado la conexión con el catálogo de productos. Reintenta en unos instantes o vuelve al inicio."}
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button 
          type="button" 
          onClick={reset}
          className="h-12 rounded-full bg-[#111111] px-8 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-[#d71920]"
        >
          Reintentar
        </Button>
        <Button asChild variant="outline" className="h-12 rounded-full border-black/10 px-8 text-[10px] font-bold uppercase tracking-widest text-[#111111] hover:bg-black hover:text-white">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
