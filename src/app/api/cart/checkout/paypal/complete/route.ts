import { NextResponse } from "next/server";

import { GYM_CART_COOKIE } from "@/lib/cart/cookie";
import { resolveCartIdFromRequest } from "@/lib/cart/member-bridge";
import { completePayPalCheckout } from "@/lib/cart/paypal-checkout";
import { createCheckoutTrace } from "@/lib/paypal/checkout-trace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function clearCartCookie(response: NextResponse) {
  response.cookies.set(GYM_CART_COOKIE, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar el checkout con PayPal.";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    cartId?: string;
    email?: string;
    notes?: string;
  };
  const cartId = await resolveCartIdFromRequest(body.cartId);

  if (!cartId) {
    return NextResponse.json(
      { error: "No se encontró un carrito activo para completar el pago." },
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
    const result = await completePayPalCheckout({
      cartId,
      email: body.email,
      notes: body.notes,
      user,
      trace,
    });

    if (result.kind === "stale-cart") {
      trace.flush("error", {
        error: result.message,
      });

      return clearCartCookie(
        NextResponse.json(
          {
            error: result.message,
          },
          { status: 409 },
        ),
      );
    }

    trace.flush("success", {
      orderId: result.pickupRequest.orderId,
      pickupRequestId: result.pickupRequest.id,
      paymentStatus: result.pickupRequest.paymentStatus,
    });

    return clearCartCookie(
      NextResponse.json({
        pickupRequest: result.pickupRequest,
        emailWarning: result.emailWarning,
      }),
    );
  } catch (error) {
    console.error(`[PayPal Checkout Error] Cart: ${cartId}`, error);
    trace.flush("error", {
      error: getErrorMessage(error),
    });
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
