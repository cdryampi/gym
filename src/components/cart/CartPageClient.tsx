"use client";

import Link from "next/link";
import { useState } from "react";

import CartLineItems from "@/components/cart/CartLineItems";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCartAmount } from "@/lib/cart/format";

export default function CartPageClient() {
  const {
    cart,
    lastSubmittedPickupRequest,
    pickupEmailWarning,
    error,
    isReady,
    isBusy,
    memberEmail,
    clearSubmittedPickupRequest,
    updateItemQuantity,
    removeItem,
    saveEmail,
    requestPickup,
  } = useCart();
  const [guestEmail, setGuestEmail] = useState(cart?.email ?? "");
  const [notes, setNotes] = useState("");

  async function handlePickupRequest() {
    if (!memberEmail) {
      const normalizedEmail = guestEmail.trim().toLowerCase();

      if (!normalizedEmail) {
        return;
      }

      if (normalizedEmail !== cart?.email) {
        await saveEmail(normalizedEmail);
      }
    }

    await requestPickup(notes.trim() || undefined);
  }

  if (!isReady) {
    return (
      <section className="section-shell py-16">
        <div className="border border-black/8 bg-white px-6 py-12 text-center">
          <p className="text-sm text-[#5f6368]">Cargando carrito...</p>
        </div>
      </section>
    );
  }

  if (lastSubmittedPickupRequest) {
    return (
      <section className="section-shell py-16">
        <div className="border border-emerald-200 bg-white px-6 py-12 shadow-[0_24px_70px_-54px_rgba(17,17,17,0.35)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Pedido enviado
          </p>
          <h1 className="mt-4 font-display text-4xl uppercase text-[#111111]">
            Hemos registrado tu solicitud pickup
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4b5563]">
            Tu numero de referencia es <strong>{lastSubmittedPickupRequest.requestNumber}</strong>.
            Usaremos <strong>{lastSubmittedPickupRequest.email}</strong> para confirmarte la
            preparacion y la recogida en el club.
          </p>
          {pickupEmailWarning ? (
            <div className="mt-6 border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              La solicitud se guardo correctamente, pero el email de confirmacion no se pudo enviar.
              El equipo puede reenviarlo desde el dashboard. Detalle: {pickupEmailWarning}
            </div>
          ) : (
            <div className="mt-6 border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
              Te acabamos de enviar un resumen tipo pedido con el detalle de la recogida.
            </div>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearSubmittedPickupRequest();
              }}
            >
              Cerrar aviso
            </Button>
            <Button asChild>
              <Link href="/tienda">Crear un pedido nuevo</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <section className="section-shell py-16">
        <div className="border border-dashed border-black/12 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(17,17,17,0.35)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
            Carrito vacio
          </p>
          <h1 className="mt-4 font-display text-4xl uppercase text-[#111111]">
            Todavia no has reservado nada
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#4b5563]">
            Explora suplementos, accesorios y merchandising del club para crear tu solicitud de
            recogida.
          </p>
          <div className="mt-8">
            <Button asChild>
              <Link href="/tienda">Ir a la tienda</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell py-12 md:py-16">
      <div className="mb-8 max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
          Carrito pickup-first
        </p>
        <h1 className="mt-3 font-display text-5xl uppercase leading-none text-[#111111]">
          Tu seleccion para recoger en el club
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#4b5563]">
          Revisa cantidades, deja un email de contacto y envia tu solicitud. El equipo de Nova
          Forza preparara el pedido para recogida local.
        </p>
      </div>

          {error ? (
        <div className="mb-6 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)] lg:items-start">
        <div className="space-y-6">
          <CartLineItems
            items={cart.items}
            disabled={isBusy}
            onQuantityChange={(lineItemId, quantity) => {
              void updateItemQuantity(lineItemId, quantity);
            }}
            onRemove={(lineItemId) => {
              void removeItem(lineItemId);
            }}
          />
        </div>

        <aside className="border border-black/8 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(17,17,17,0.35)]">
          <h2 className="font-display text-3xl uppercase text-[#111111]">Resumen</h2>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between text-[#5f6368]">
              <span>Productos</span>
              <span>{cart.summary.itemCount}</span>
            </div>
            <div className="flex items-center justify-between text-[#5f6368]">
              <span>Subtotal</span>
              <span>{formatCartAmount(cart.summary.subtotal, cart.summary.currencyCode)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-black/8 pt-3 font-semibold text-[#111111]">
              <span>Total estimado</span>
              <span>{formatCartAmount(cart.summary.total, cart.summary.currencyCode)}</span>
            </div>
          </div>

          <div className="mt-6 rounded-none border border-black/8 bg-[#fbfbf8] p-4 text-sm leading-7 text-[#5f6368]">
            Recogida local en Nova Forza Gym. No se solicitan direccion ni metodos de envio en esta
            fase.
          </div>

          {!memberEmail ? (
            <div className="mt-6 space-y-3">
              <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#111111]">
                Email de contacto
              </label>
              <Input
                type="email"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
                placeholder="tu@email.com"
                disabled={isBusy}
              />
            </div>
          ) : (
            <div className="mt-6 border border-black/8 bg-[#fbfbf8] p-4 text-sm leading-7 text-[#5f6368]">
              La solicitud se vinculara a tu cuenta de socio: <strong>{memberEmail}</strong>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#111111]">
              Nota para recogida
            </label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ejemplo: pasare por recepcion a ultima hora de la tarde."
              disabled={isBusy}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              type="button"
              disabled={isBusy || (!memberEmail && !guestEmail.trim())}
              onClick={() => {
                void handlePickupRequest();
              }}
            >
              Solicitar recogida
            </Button>
            <Button asChild variant="outline">
              <Link href="/tienda">Seguir comprando</Link>
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}
