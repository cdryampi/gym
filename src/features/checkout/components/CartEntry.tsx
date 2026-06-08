"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { CartLineItems } from "./CartLineItems";
import { useCart } from "../hooks/use-cart";
import PublicInlineAlert from "@/components/public/PublicInlineAlert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCartAmount } from "@/lib/cart/format";

export function CartEntry() {
  const { cart, error, isBusy, isDrawerOpen, setDrawerOpen, updateItemQuantity, removeItem } =
    useCart();
  const itemCount = cart?.summary.itemCount ?? 0;
  const currencyCode = cart?.summary.currencyCode ?? "PEN";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 px-3 sm:h-10 sm:px-4 flex items-center gap-2 border-black/10 bg-white hover:bg-neutral-50 hover:border-black/25 transition-all text-[11px] font-bold uppercase tracking-wider text-neutral-800"
        onClick={() => setDrawerOpen(true)}
        aria-label="Abrir reserva"
      >
        <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-600" />
        <span className="hidden xs:inline">Reserva</span>
        <span className={cn(
          "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-colors",
          itemCount > 0
            ? "bg-[#d71920] text-white"
            : "bg-neutral-100 text-neutral-500 border border-neutral-200"
        )}>
          {itemCount}
        </span>
      </Button>

      <Dialog open={isDrawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tu reserva</DialogTitle>
            <DialogDescription>
              Gestiona tus productos y termina la solicitud de recogida desde la página completa de la
              reserva.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="mt-4">
              <PublicInlineAlert
                tone="error"
                title="No pudimos actualizar la reserva"
                message={error}
                compact
              />
            </div>
          ) : null}

          {!cart || cart.items.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-none border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center transition-all">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-800 tracking-tight">Tu reserva está vacía</h3>
              <p className="mt-2 max-w-sm text-sm text-neutral-500">
                Explora productos para añadirlos a tu reserva.
              </p>
              <div className="mt-6">
                <Button asChild className="rounded-none bg-[#d71920] hover:bg-[#111111] px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all shadow-md">
                  <Link href="/tienda" onClick={() => setDrawerOpen(false)}>
                    Explorar tienda
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <CartLineItems
                items={cart.items}
                compact
                disabled={isBusy}
                onQuantityChange={(lineItemId, quantity) => {
                  void updateItemQuantity(lineItemId, quantity);
                }}
                onRemove={(lineItemId) => {
                  void removeItem(lineItemId);
                }}
              />

              <div className="rounded-none border border-black/8 bg-[#fbfbf8] p-4">
                <div className="flex items-center justify-between text-sm text-[#5f6368]">
                  <span>Subtotal</span>
                  <span>{formatCartAmount(cart.summary.subtotal, currencyCode)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between font-semibold text-[#111111]">
                  <span>Total estimado</span>
                  <span>{formatCartAmount(cart.summary.total, currencyCode)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button asChild variant="outline">
                  <Link href="/tienda" onClick={() => setDrawerOpen(false)}>
                    Seguir comprando
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/carrito" onClick={() => setDrawerOpen(false)}>
                    Ver carrito completo
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
