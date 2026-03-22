export const GYM_CART_COOKIE = "gym_cart_id";
export const GYM_CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function buildCookieValue(cartId: string, maxAge = GYM_CART_COOKIE_MAX_AGE) {
  return `${GYM_CART_COOKIE}=${encodeURIComponent(cartId)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export function getCartIdFromDocumentCookie() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of cookies) {
    if (!entry.startsWith(`${GYM_CART_COOKIE}=`)) {
      continue;
    }

    return decodeURIComponent(entry.slice(GYM_CART_COOKIE.length + 1));
  }

  return null;
}

export function persistCartIdInCookie(cartId: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = buildCookieValue(cartId);
}

export function clearCartIdCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${GYM_CART_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}
