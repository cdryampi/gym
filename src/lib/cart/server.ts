import { cookies } from "next/headers";

import { GYM_CART_COOKIE } from "@/lib/cart/cookie";
import { retrieveCart } from "@/lib/cart/medusa";

export async function getCartIdFromRequestCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(GYM_CART_COOKIE)?.value ?? null;
}

export async function getCurrentCartSnapshot() {
  const cartId = await getCartIdFromRequestCookies();

  if (!cartId) {
    return null;
  }

  try {
    const cart = await retrieveCart(cartId);

    if (cart.summary.pickupRequestStatus === "submitted") {
      return null;
    }

    return cart;
  } catch {
    return null;
  }
}
