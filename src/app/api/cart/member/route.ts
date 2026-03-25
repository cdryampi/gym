import { NextResponse } from "next/server";

import { GYM_CART_COOKIE } from "@/lib/cart/cookie";
import { mapMedusaCart } from "@/lib/cart/medusa";
import {
  attachCartToMember,
  resolveCartIdFromRequest,
  resolveOrCreateMemberCommerceCustomer,
} from "@/lib/cart/member-bridge";
import { isMissingCartMessage, STALE_CART_MESSAGE } from "@/lib/cart/runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo sincronizar el carrito del miembro.";
}

function clearCartCookie(response: NextResponse) {
  response.cookies.set(GYM_CART_COOKIE, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      { error: "Necesitas iniciar sesion para vincular el carrito a tu cuenta." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { cartId?: string };
  const cartId = await resolveCartIdFromRequest(body.cartId);

  try {
    const customerBridge = await resolveOrCreateMemberCommerceCustomer(user);
    const cartResponse = cartId
      ? await attachCartToMember(cartId, customerBridge.medusa_customer_id, user.email)
      : null;

    return NextResponse.json({
      customer: customerBridge,
      cart: cartResponse ? mapMedusaCart(cartResponse.cart) : null,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    if (cartId && isMissingCartMessage(message)) {
      return clearCartCookie(
        NextResponse.json({ error: STALE_CART_MESSAGE }, { status: 409 }),
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
