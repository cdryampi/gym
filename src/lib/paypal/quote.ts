import type { Cart } from "@/lib/cart/types";
import { getMedusaCommerceProductBySlug } from "@/lib/commerce/medusa";

export interface PayPalChargeQuote {
  displayCurrencyCode: string;
  displayAmount: number;
  chargeCurrencyCode: string;
  chargeAmount: number;
  exchangeRate: number | null;
  exchangeRateSource: string | null;
  exchangeRateReference: string | null;
}

function roundCurrencyAmount(amount: number) {
  return Math.round(amount * 100) / 100;
}

export async function resolvePayPalChargeQuote(cart: Cart): Promise<PayPalChargeQuote> {
  if (cart.items.length === 0) {
    throw new Error("No hay productos en el carrito para preparar PayPal.");
  }

  const cartHandles = cart.items.map((item) => item.productHandle?.trim() ?? "");
  if (cartHandles.some((handle) => !handle)) {
    throw new Error(
      "Uno de los productos del carrito no tiene handle commerce valido para preparar PayPal.",
    );
  }

  const handles = Array.from(
    new Set(cartHandles.filter((handle): handle is string => Boolean(handle))),
  );

  const products = await Promise.all(
    handles.map(async (handle) => [handle, await getMedusaCommerceProductBySlug(handle)] as const),
  );
  const productsByHandle = new Map(products);

  const missingProducts = new Set<string>();
  const missingPayPalPrices = new Set<string>();
  let chargeAmount = 0;

  for (const item of cart.items) {
    const handle = item.productHandle?.trim();

    if (!handle) {
      throw new Error(
        "Uno de los productos del carrito no tiene handle commerce valido para preparar PayPal.",
      );
    }

    const product = productsByHandle.get(handle) ?? null;

    if (!product) {
      missingProducts.add(item.productTitle ?? item.title);
      continue;
    }

    if (product.paypal_price_usd === null) {
      missingPayPalPrices.add(product.name);
      continue;
    }

    chargeAmount += product.paypal_price_usd * item.quantity;
  }

  if (missingProducts.size > 0) {
    throw new Error(
      `No se pudieron resolver en Medusa estos productos del carrito: ${Array.from(missingProducts).join(", ")}.`,
    );
  }

  if (missingPayPalPrices.size > 0) {
    throw new Error(
      `Falta configurar el precio estimado PayPal en USD para: ${Array.from(missingPayPalPrices).join(", ")}.`,
    );
  }

  const normalizedChargeAmount = roundCurrencyAmount(chargeAmount);

  if (normalizedChargeAmount <= 0) {
    throw new Error("El monto estimado en USD para PayPal no es valido.");
  }

  return {
    displayCurrencyCode: cart.summary.currencyCode.toUpperCase(),
    displayAmount: roundCurrencyAmount(cart.summary.total),
    chargeCurrencyCode: "USD",
    chargeAmount: normalizedChargeAmount,
    exchangeRate: null,
    exchangeRateSource: null,
    exchangeRateReference: null,
  };
}
