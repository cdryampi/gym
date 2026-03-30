import { NextResponse } from "next/server";

import {
  CHECKOUT_MANUAL_REVIEW_MESSAGE,
  CHECKOUT_PROCESSING_MESSAGE,
  CHECKOUT_STATUS_ERROR_MESSAGE,
  resolvePayPalCheckoutStatus,
} from "@/lib/cart/paypal-checkout";
import { createCheckoutTrace } from "@/lib/paypal/checkout-trace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo comprobar el estado del pago.";
}

function parseAttempt(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cartId = url.searchParams.get("cartId")?.trim() ?? null;
  const attempt = parseAttempt(url.searchParams.get("attempt"));

  if (!cartId) {
    return NextResponse.json(
      { error: "No se encontro un carrito para comprobar el estado del pago." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const trace = createCheckoutTrace({
    route: "paypal-complete",
    cartId,
    userId: user?.id ?? null,
  });

  try {
    const result = await resolvePayPalCheckoutStatus({
      cartId,
      user,
      attempt,
      trace,
    });

    trace.flush("success", {
      status: result.status,
      pickupRequestId: result.status === "ready" ? result.pickupRequest.id : null,
    });

    if (result.status === "ready") {
      return NextResponse.json({
        status: "ready",
        pickupRequestId: result.pickupRequest.id,
      });
    }

    if (result.status === "error") {
      return NextResponse.json({
        status: "error",
        message: result.message ?? CHECKOUT_STATUS_ERROR_MESSAGE,
      });
    }

    return NextResponse.json({
      status: result.status,
      message:
        result.status === "pending_manual_review"
          ? result.message ?? CHECKOUT_MANUAL_REVIEW_MESSAGE
          : result.message ?? CHECKOUT_PROCESSING_MESSAGE,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    trace.flush("error", {
      error: message,
    });

    return NextResponse.json(
      {
        status: "error",
        message: CHECKOUT_STATUS_ERROR_MESSAGE,
        detail: message,
      },
      { status: 500 },
    );
  }
}
