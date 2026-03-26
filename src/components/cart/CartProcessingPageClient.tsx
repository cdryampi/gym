"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";

import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 2000;
const DEFAULT_PROCESSING_MESSAGE =
  "PayPal ya ha confirmado tu pago. Estamos terminando de registrar tu pedido en Nova Forza. No vuelvas a pagar.";

type CheckoutStatusPayload =
  | {
      status: "ready";
      pickupRequestId: string;
    }
  | {
      status: "processing" | "pending_manual_review";
      message?: string;
    }
  | {
      error: string;
    };

export default function CartProcessingPageClient({
  cartId,
}: Readonly<{
  cartId: string;
}>) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState(DEFAULT_PROCESSING_MESSAGE);
  const [isPolling, setIsPolling] = useState(true);
  const [isEscalated, setIsEscalated] = useState(false);

  const checkStatus = useEffectEvent(async (currentAttempt: number) => {
    try {
      const response = await fetch(
        `/api/cart/checkout/paypal/status?cartId=${encodeURIComponent(cartId)}&attempt=${currentAttempt}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const payload = (await response.json().catch(() => ({}))) as CheckoutStatusPayload;

      if (!response.ok) {
        throw new Error("No se pudo comprobar el estado final del pedido.");
      }

      if ("status" in payload && payload.status === "ready" && payload.pickupRequestId) {
        router.replace(`/carrito/confirmacion/${payload.pickupRequestId}`);
        return;
      }

      if ("status" in payload && payload.status === "pending_manual_review") {
        setMessage(payload.message ?? DEFAULT_PROCESSING_MESSAGE);
        setIsEscalated(true);
        setIsPolling(false);
        return;
      }

      if ("status" in payload && payload.status === "processing") {
        setMessage(payload.message ?? DEFAULT_PROCESSING_MESSAGE);
        setIsEscalated(false);
        setIsPolling(true);
        return;
      }

      throw new Error("No se pudo resolver el estado final del pedido.");
    } catch {
      if (currentAttempt >= 6) {
        setMessage(
          "Hemos recibido tu pago, pero todavia estamos terminando de registrarlo. No vuelvas a pagar. Puedes revisar Mi cuenta en unos instantes.",
        );
        setIsEscalated(true);
        setIsPolling(false);
        return;
      }

      setMessage(DEFAULT_PROCESSING_MESSAGE);
      setIsEscalated(false);
      setIsPolling(true);
    }
  });

  useEffect(() => {
    void checkStatus(attempt);
  }, [attempt]);

  useEffect(() => {
    if (!isPolling) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setAttempt((current) => current + 1);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [attempt, isPolling]);

  return (
    <section className="section-shell py-16">
      <div className="border border-emerald-200 bg-white px-6 py-12 shadow-[0_24px_70px_-54px_rgba(17,17,17,0.35)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
          Pago recibido
        </p>
        <h1 className="mt-4 font-display text-4xl uppercase text-[#111111]">
          Estamos registrando tu pedido pickup
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#4b5563]">{message}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="border border-black/8 bg-[#fbfbf8] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
              Referencia temporal
            </p>
            <p className="mt-2 font-mono text-sm text-[#111111]">{cartId}</p>
          </div>
          <div
            className={`border p-4 ${
              isEscalated ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
              Estado
            </p>
            <div className="mt-3 flex items-center gap-3 text-sm font-medium text-[#111111]">
              <div
                className={`h-3 w-3 rounded-full ${
                  isEscalated ? "bg-amber-500" : "animate-pulse bg-emerald-500"
                }`}
              />
              {isEscalated ? "Revision en curso" : "Sincronizando pedido"}
            </div>
          </div>
        </div>

        <div className="mt-8 border border-black/8 bg-[#fbfbf8] p-5 text-sm leading-7 text-[#4b5563]">
          No necesitas volver a pagar. En cuanto el pedido quede proyectado te llevaremos
          automaticamente a la confirmacion final.
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/mi-cuenta">Ir a Mi cuenta</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/tienda">Seguir comprando</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
