"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";

import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 2000;
const DEFAULT_PROCESSING_MESSAGE =
  "PayPal ya ha confirmado tu pago. Estamos terminando de registrar tu pedido en Nova Forza. No vuelvas a pagar.";
const DEFAULT_MANUAL_REVIEW_MESSAGE =
  "Hemos recibido tu pago y lo estamos revisando manualmente. No vuelvas a pagar. Si en un minuto no ves el pedido en Mi cuenta, contacta con el club.";
const DEFAULT_ERROR_MESSAGE =
  "No hemos podido confirmar el estado final del pedido desde la web. No vuelvas a pagar por ahora. Primero revisa Mi cuenta y, si no aparece, contacta con el club con tu referencia temporal.";

type CheckoutViewState = "processing" | "manual_review" | "error";

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
      status: "error";
      message?: string;
      detail?: string;
    }
  | {
      error: string;
    };

const stateMeta: Record<
  CheckoutViewState,
  {
    eyebrow: string;
    title: string;
    statusLabel: string;
    statusClassName: string;
    panelClassName: string;
    guidanceClassName: string;
    guidanceTitle: string;
    guidanceBody: string;
  }
> = {
  processing: {
    eyebrow: "Pago recibido",
    title: "Estamos registrando tu pedido pickup",
    statusLabel: "Sincronizando pedido",
    statusClassName: "animate-pulse bg-emerald-500",
    panelClassName: "border-emerald-200 bg-emerald-50",
    guidanceClassName: "border-black/8 bg-[#fbfbf8]",
    guidanceTitle: "Que hacer ahora",
    guidanceBody:
      "No necesitas volver a pagar. En cuanto el pedido quede proyectado te llevaremos automaticamente a la confirmacion final.",
  },
  manual_review: {
    eyebrow: "Revision necesaria",
    title: "Estamos revisando tu pago manualmente",
    statusLabel: "Revision manual",
    statusClassName: "bg-amber-500",
    panelClassName: "border-amber-200 bg-amber-50",
    guidanceClassName: "border-amber-200 bg-amber-50",
    guidanceTitle: "Siguiente paso recomendado",
    guidanceBody:
      "No vuelvas a pagar. Revisa Mi cuenta en unos instantes y, si el pedido no aparece, comparte esta referencia temporal al contactar con el club.",
  },
  error: {
    eyebrow: "Comprobacion detenida",
    title: "No hemos podido confirmar tu pedido desde la web",
    statusLabel: "Necesita comprobacion",
    statusClassName: "bg-red-500",
    panelClassName: "border-red-200 bg-red-50",
    guidanceClassName: "border-red-200 bg-red-50",
    guidanceTitle: "Antes de reintentar",
    guidanceBody:
      "No repitas el pago por ahora. Primero revisa Mi cuenta. Si el pedido no aparece tras unos instantes, contacta con el club usando esta referencia temporal.",
  },
};

export default function CartProcessingPageClient({
  cartId,
}: Readonly<{
  cartId: string;
}>) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [viewState, setViewState] = useState<CheckoutViewState>("processing");
  const [message, setMessage] = useState(DEFAULT_PROCESSING_MESSAGE);
  const [isPolling, setIsPolling] = useState(true);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

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

      if ("status" in payload && payload.status === "ready" && payload.pickupRequestId) {
        router.replace(`/carrito/confirmacion/${payload.pickupRequestId}`);
        return;
      }

      if ("status" in payload && payload.status === "error") {
        setMessage(payload.message ?? DEFAULT_ERROR_MESSAGE);
        setErrorDetail(payload.detail ?? null);
        setViewState("error");
        setIsPolling(false);
        return;
      }

      if ("status" in payload && payload.status === "pending_manual_review") {
        setMessage(payload.message ?? DEFAULT_MANUAL_REVIEW_MESSAGE);
        setErrorDetail(null);
        setViewState("manual_review");
        setIsPolling(false);
        return;
      }

      if ("status" in payload && payload.status === "processing") {
        setMessage(payload.message ?? DEFAULT_PROCESSING_MESSAGE);
        setErrorDetail(null);
        setViewState("processing");
        setIsPolling(true);
        return;
      }

      if (!response.ok) {
        throw new Error("No se pudo comprobar el estado final del pedido.");
      }

      if ("error" in payload && payload.error) {
        throw new Error(payload.error);
      }

      throw new Error("No se pudo resolver el estado final del pedido.");
    } catch {
      if (currentAttempt >= 2) {
        setMessage(DEFAULT_ERROR_MESSAGE);
        setErrorDetail(null);
        setViewState("error");
        setIsPolling(false);
        return;
      }

      setMessage(DEFAULT_PROCESSING_MESSAGE);
      setErrorDetail(null);
      setViewState("processing");
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

  const meta = stateMeta[viewState];

  return (
    <section className="section-shell py-16">
      <div className="border border-emerald-200 bg-white px-6 py-12 shadow-[0_24px_70px_-54px_rgba(17,17,17,0.35)]">
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
            viewState === "error"
              ? "text-red-700"
              : viewState === "manual_review"
                ? "text-amber-700"
                : "text-emerald-700"
          }`}
        >
          {meta.eyebrow}
        </p>
        <h1 className="mt-4 font-display text-4xl uppercase text-[#111111]">
          {meta.title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#4b5563]">{message}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="border border-black/8 bg-[#fbfbf8] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
              Referencia temporal
            </p>
            <p className="mt-2 font-mono text-sm text-[#111111]">{cartId}</p>
            <p className="mt-2 text-xs leading-5 text-[#5f6368]">
              Si necesitas ayuda, comparte este identificador al equipo del club.
            </p>
          </div>
          <div className={`border p-4 ${meta.panelClassName}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
              Estado
            </p>
            <div className="mt-3 flex items-center gap-3 text-sm font-medium text-[#111111]">
              <div className={`h-3 w-3 rounded-full ${meta.statusClassName}`} />
              {meta.statusLabel}
            </div>
          </div>
        </div>

        <div className={`mt-8 border p-5 text-sm leading-7 text-[#4b5563] ${meta.guidanceClassName}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#111111]">
            {meta.guidanceTitle}
          </p>
          <p className="mt-3">{meta.guidanceBody}</p>
          {errorDetail ? (
            <p className="mt-3 text-xs leading-5 text-[#7f1d1d]">Detalle tecnico: {errorDetail}</p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant={viewState === "processing" ? "outline" : "default"}
            onClick={() => {
              setViewState("processing");
              setMessage(DEFAULT_PROCESSING_MESSAGE);
              setErrorDetail(null);
              setIsPolling(true);
              setAttempt((current) => current + 1);
            }}
          >
            Comprobar estado ahora
          </Button>
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
