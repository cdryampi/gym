import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="section-shell flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b7280]">
        Producto no encontrado
      </p>
      <h1 className="mt-4 font-display text-5xl uppercase text-[#111111]">Esta ficha no existe</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4b5563]">
        Puede que el producto se haya retirado del catálogo o que el enlace ya no sea válido.
      </p>
      <Button asChild variant="outline" className="mt-8">
        <Link href="/tienda">Volver a la tienda</Link>
      </Button>
    </div>
  );
}
