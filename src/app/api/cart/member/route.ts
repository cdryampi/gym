import { NextResponse } from "next/server";

import { GYM_CART_COOKIE } from "@/lib/cart/cookie";
import { mapMedusaCart, retrieveCart } from "@/lib/cart/medusa";
import {
  attachCartToMember,
  revalidateMemberCommerceCustomer,
  retrieveActiveCartForMember,
  resolveCartIdFromRequest,
  resolveOrCreateMemberCommerceCustomer,
} from "@/lib/cart/member-bridge";
import { isMissingCartMessage, STALE_CART_MESSAGE } from "@/lib/cart/runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo sincronizar el carrito del miembro.";
}

function isRecoverableActiveCartLookupError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalized = error.message.toLowerCase();

  return (
    normalized.includes("no se pudo recuperar el carrito activo del socio") &&
    normalized.includes("not found")
  );
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
    let customerBridge = await resolveOrCreateMemberCommerceCustomer(user);
    let cartResponse = null;
    let fallbackCart = null;

    if (cartId) {
      try {
        cartResponse = await attachCartToMember(cartId, customerBridge.medusa_customer_id, user.email);
      } catch (attachError) {
        const attachMessage = getErrorMessage(attachError);

        if (!isMissingCartMessage(attachMessage)) {
          throw attachError;
        }

        try {
          customerBridge = await revalidateMemberCommerceCustomer(user);
          cartResponse = await attachCartToMember(cartId, customerBridge.medusa_customer_id, user.email);
        } catch (retryError) {
          try {
            fallbackCart = await retrieveCart(cartId);
          } catch {
            throw retryError;
          }
        }
      }
    } else {
      try {
        const activeCartResponse = await retrieveActiveCartForMember(
          customerBridge.medusa_customer_id,
        );

        cartResponse = activeCartResponse?.cart ? { cart: activeCartResponse.cart } : null;
      } catch (activeCartError) {
        if (!isRecoverableActiveCartLookupError(activeCartError)) {
          throw activeCartError;
        }

        cartResponse = null;
      }
    }

    return NextResponse.json({
      customer: customerBridge,
      cart: fallbackCart ?? (cartResponse ? mapMedusaCart(cartResponse.cart) : null),
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
