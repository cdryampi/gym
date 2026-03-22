import { NextResponse } from "next/server";

import { mapMedusaCart } from "@/lib/cart/medusa";
import {
  attachCartToMember,
  resolveCartIdFromRequest,
  resolveOrCreateMemberCommerceCustomer,
} from "@/lib/cart/member-bridge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo sincronizar el carrito del miembro.";
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
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
