export const STALE_CART_MESSAGE =
  "Tu carrito anterior ya no estaba disponible. Hemos limpiado la sesión para que puedas empezar otro pedido.";

export const STALE_COMPLETED_CART_MESSAGE =
  "Este carrito ya estaba completado. Hemos limpiado la sesión para que puedas empezar otro pedido.";

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function isMissingCartMessage(message: string | null | undefined) {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();

  return (
    normalized.includes("no se pudo cargar el carrito") ||
    normalized.includes("no hay un carrito activo") ||
    normalized.includes("no se encontro un carrito activo") ||
    normalized.includes("no se encontró un carrito activo") ||
    normalized.includes("cart not found") ||
    normalized.includes("already completed") ||
    normalized.includes("is already completed") ||
    normalized.includes("ya esta completado") ||
    normalized.includes("ya está completado") ||
    normalized.includes("requested resource id was not found") ||
    normalized.includes("cart with id") ||
    normalized.includes("does not exist")
  );
}
