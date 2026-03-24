"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import CartLineItems from "@/components/cart/CartLineItems";
import PayPalCheckoutButton from "@/components/cart/PayPalCheckoutButton";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCartAmount } from "@/lib/cart/format";
import {
  getPickupRequestPaymentTone,
  pickupRequestPaymentStatusLabels,
} from "@/lib/cart/pickup-request";
import { Badge } from "@/components/ui/badge";
import { isPayPalPaymentProviderId } from "@/lib/medusa/paypal-provider";

export default function CartPageClient() {
  const router = useRouter();
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
    preparePayPalCheckout,
    completePayPalCheckout,
  } = useCart();
  const [guestEmail, setGuestEmail] = useState(cart?.email ?? "");
  const [notes, setNotes] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
  const paypalSession =
    cart?.paymentSession && isPayPalPaymentProviderId(cart.paymentSession.providerId)
      ? cart.paymentSession
      : null;
  const hasPayPalChargeAmount =
    paypalSession !== null &&
    Boolean(paypalSession.currencyCode) &&
    paypalSession.amount > 0;

  async function handlePreparePayPal() {
    const normalizedEmail = guestEmail.trim().toLowerCase();

    setCheckoutMessage(null);

    if (!memberEmail && !normalizedEmail) {
      return;
    }

    if (!memberEmail && normalizedEmail !== cart?.email) {
      await saveEmail(normalizedEmail);
    }

    const preparedCart = await preparePayPalCheckout({
      email: memberEmail ? undefined : normalizedEmail || undefined,
      notes: notes.trim() || undefined,
    });

    if (preparedCart?.paymentSession?.orderId) {
      setCheckoutMessage("PayPal ya está listo. Aprueba el pago para completar tu pedido.");
    }
  }

  async function handleApprovePayPal() {
    const normalizedEmail = guestEmail.trim().toLowerCase();
    const pickupRequest = await completePayPalCheckout({
      email: memberEmail ? undefined : normalizedEmail || undefined,
      notes: notes.trim() || undefined,
    });

    if (!pickupRequest?.id) {
      // Re-throw so PayPalCheckoutButton's onApprove catch resets isPending.
      // The error message is already surfaced via setError in CartProvider.
      throw new Error("checkout-failed");
    }

    router.push(`/carrito/confirmacion/${pickupRequest.id}`);
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
            Tu número de referencia es <strong>{lastSubmittedPickupRequest.requestNumber}</strong>.
            Usaremos <strong>{lastSubmittedPickupRequest.email}</strong> para confirmarte la
            preparación y la recogida en el club.
          </p>
          {pickupEmailWarning ? (
            <div className="mt-6 border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              La solicitud se guardó correctamente, pero el email de confirmación no se pudo enviar.
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
            Todavía no has reservado nada
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
          Revisa cantidades, deja un email de contacto y paga online con PayPal. La tienda muestra
          el total real en PEN y PayPal cobra el importe estimado en USD configurado para tu
          pedido. Si tu cuenta usa otra moneda, la conversión final la resuelve PayPal.
        </p>
      </div>

      {error ? (
        <div className="mb-6 border border-red-200 bg-red-100 flex items-center gap-3 px-5 py-4 text-sm text-red-700">
          <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse shrink-0" />
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
            Recogida local en Nova Forza Gym. El pago se confirma online con PayPal y no se
            solicitan dirección ni métodos de envío.
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
              La solicitud se vinculará a tu cuenta de socio: <strong>{memberEmail}</strong>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#111111]">
              Nota para recogida
            </label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ejemplo: pasaré por recepción a última hora de la tarde."
              disabled={isBusy}
            />
          </div>

          {paypalSession ? (
            <div className="mt-6 border border-emerald-200 bg-emerald-50/50 p-5 text-sm leading-relaxed text-[#5f6368]">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-display text-sm uppercase text-[#111111]">PayPal Preparado</span>
                </div>
                <Badge variant={getPickupRequestPaymentTone(paypalSession.status)}>
                  {pickupRequestPaymentStatusLabels[paypalSession.status]}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#111111]">
                    ID Transacción
                  </span>
                  <span className="font-mono text-xs">{paypalSession.orderId ?? "pendiente"}</span>
                </div>

                {paypalSession.displayAmount !== null && paypalSession.displayCurrencyCode ? (
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#111111]">
                      Equivalente Tienda
                    </span>
                    <span className="font-medium text-[#111111]">
                      {formatCartAmount(
                        paypalSession.displayAmount,
                        paypalSession.displayCurrencyCode,
                      )}
                    </span>
                  </div>
                ) : null}

                {hasPayPalChargeAmount ? (
                  <div className="flex justify-between items-baseline bg-white/50 -mx-5 px-5 py-3 border-y border-emerald-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Importe a Pagar (USD)
                    </span>
                    <span className="font-display text-lg text-emerald-900">
                      {formatCartAmount(paypalSession.amount, paypalSession.currencyCode)}
                    </span>
                  </div>
                ) : null}

                {paypalSession.exchangeRate ? (
                  <p className="mt-2 text-[11px] leading-5 text-[#7a7f87] italic">
                    Tipo de cambio informativo: S/ {paypalSession.exchangeRate.toFixed(3)} por USD.
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] leading-5 text-emerald-700/70 font-medium">
                    PayPal procesará el cobro en USD siguiendo el importe estimado por producto.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3">
            {!paypalSession?.orderId ? (
              <>
                <div className="border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  Los precios de tienda se mantienen en {cart?.summary.currencyCode ?? "PEN"}.
                  Al preparar PayPal usaremos el importe estimado en USD configurado por producto.
                  Si tu cuenta usa otra moneda, la conversión final la hará PayPal.
                </div>
                <Button
                  type="button"
                  disabled={isBusy || (!memberEmail && !guestEmail.trim())}
                  onClick={() => {
                    void handlePreparePayPal();
                  }}
                >
                  Preparar pago con PayPal
                </Button>
              </>
            ) : paypalClientId ? (
                <div className="space-y-4">
                  <PayPalCheckoutButton
                    clientId={paypalClientId}
                    currencyCode={paypalSession.currencyCode}
                    orderId={paypalSession.orderId}
                    disabled={isBusy}
                    onApproveCheckout={handleApprovePayPal}
                    onCancel={() => {
                      setCheckoutMessage("Has cancelado el pago. Tu seleccion sigue guardada.");
                    }}
                    onError={(message) => {
                      setCheckoutMessage(message);
                    }}
                  />
                  {checkoutMessage && (
                    <div className="text-xs text-center font-medium text-emerald-800 animate-in fade-in slide-in-from-top-1">
                      {checkoutMessage}
                    </div>
                  )}
                </div>
            ) : (
              <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Falta NEXT_PUBLIC_PAYPAL_CLIENT_ID, asi que no podemos cargar el boton sandbox.
              </div>
            )}
            <Button asChild variant="outline">
              <Link href="/tienda">Seguir comprando</Link>
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}
