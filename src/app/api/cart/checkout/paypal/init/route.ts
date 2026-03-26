import { NextResponse } from "next/server";

import { resolveCartIdFromRequest } from "@/lib/cart/member-bridge";
import { preparePayPalCheckout } from "@/lib/cart/paypal-checkout";
import { createCheckoutTrace } from "@/lib/paypal/checkout-trace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo preparar el checkout con PayPal.";
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
      { error: "No se encontró un carrito activo para preparar el pago." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const trace = createCheckoutTrace({
    route: "paypal-init",
    cartId,
    userId: user?.id ?? null,
  });

  try {
    const result = await preparePayPalCheckout({
      cartId,
      email: body.email,
      notes: body.notes,
      user,
      trace,
    });

    trace.flush("success", {
      paymentSessionId: result.cart.paymentSession?.id ?? null,
      paymentOrderId: result.cart.paymentSession?.paypalOrderId ?? null,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = getErrorMessage(error);
    trace.flush("error", { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
