"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import CartLineItems from "@/components/cart/CartLineItems";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCartAmount } from "@/lib/cart/format";

export default function CartEntry() {
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
        className="relative h-10 w-10 px-0"
        onClick={() => setDrawerOpen(true)}
        aria-label="Abrir carrito"
      >
        <ShoppingBag className="h-4 w-4" />
        {itemCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d71920] px-1 text-[10px] font-bold text-white">
            {itemCount}
          </span>
        ) : null}
      </Button>

      <Dialog open={isDrawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tu carrito</DialogTitle>
            <DialogDescription>
              Gestiona tus productos y termina la solicitud de recogida desde la pagina completa del
              carrito.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!cart || cart.items.length === 0 ? (
            <div className="mt-6 border border-dashed border-black/12 px-6 py-10 text-center">
              <p className="text-sm text-[#5f6368]">Todavia no has anadido productos al carrito.</p>
              <div className="mt-6">
                <Button asChild>
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
