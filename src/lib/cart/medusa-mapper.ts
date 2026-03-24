import { getDefaultCommerceCurrencyCode } from "@/lib/commerce/currency";
import { normalizeCommerceImageUrl } from "@/lib/commerce/image-urls";
import type { Cart, CartLineItem } from "@/lib/cart/types";

import {
  asString,
  mapSelectedOptions,
  MEDUSA_CART_FIELDS,
  normalizeAmount,
  normalizeOptionalAmount,
  normalizePaymentSessionStatus,
  type MedusaCart,
  type MedusaCartLineItem,
} from "./medusa-shared";

function mapLineItem(item: MedusaCartLineItem, currencyCode: string): CartLineItem {
  return {
    id: item.id,
    title: asString(item.title) ?? "Producto en carrito",
    thumbnail: normalizeCommerceImageUrl(asString(item.thumbnail)),
    quantity: item.quantity,
    productId: asString(item.product_id),
    productTitle: asString(item.product_title),
    productHandle: asString(item.product_handle),
    variantId: asString(item.variant_id),
    variantTitle: asString(item.variant_title),
    variantSku: asString(item.variant_sku),
    unitPrice: normalizeAmount(item.unit_price),
    subtotal: normalizeAmount(item.subtotal),
    total: normalizeAmount(item.total),
    currencyCode,
    requiresShipping: Boolean(item.requires_shipping),
    selectedOptions: mapSelectedOptions(item.variant_option_values),
  };
}

function mapPaymentSession(cart: MedusaCart): Cart["paymentSession"] {
  const paymentSessions = cart.payment_collection?.payment_sessions;

  if (!Array.isArray(paymentSessions) || paymentSessions.length === 0) {
    return null;
  }

  const currentSession =
    paymentSessions.find((session) => session && typeof session === "object") ?? null;

  if (!currentSession || typeof currentSession !== "object") {
    return null;
  }

  const sessionRecord = currentSession as Record<string, unknown>;
  const sessionData =
    sessionRecord.data &&
    typeof sessionRecord.data === "object" &&
    !Array.isArray(sessionRecord.data)
      ? (sessionRecord.data as Record<string, unknown>)
      : {};

  return {
    id: asString(sessionRecord.id) ?? "unknown",
    providerId: asString(sessionRecord.provider_id) ?? "unknown",
    status: normalizePaymentSessionStatus(asString(sessionRecord.status) ?? "pending"),
    amount: normalizeAmount(
      typeof sessionData.charge_amount === "number"
        ? sessionData.charge_amount
        : typeof sessionRecord.amount === "number"
          ? sessionRecord.amount
          : null,
    ),
    currencyCode:
      asString(sessionData.charge_currency_code)?.toUpperCase() ??
      asString(sessionRecord.currency_code)?.toUpperCase() ??
      asString(cart.currency_code)?.toUpperCase() ??
      getDefaultCommerceCurrencyCode(),
    displayAmount: normalizeOptionalAmount(
      typeof sessionData.display_amount === "number" ? sessionData.display_amount : null,
    ),
    displayCurrencyCode: asString(sessionData.display_currency_code)?.toUpperCase() ?? null,
    exchangeRate:
      typeof sessionData.exchange_rate === "number" && Number.isFinite(sessionData.exchange_rate)
        ? sessionData.exchange_rate
        : null,
    exchangeRateSource: asString(sessionData.exchange_rate_source),
    exchangeRateReference: asString(sessionData.exchange_rate_reference),
    orderId: asString(sessionData.order_id),
    authorizationId: asString(sessionData.authorization_id),
    captureId: asString(sessionData.capture_id),
    data: sessionData,
  };
}

export function mapMedusaCart(cart: MedusaCart): Cart {
  const currencyCode =
    asString(cart.currency_code)?.toUpperCase() ?? getDefaultCommerceCurrencyCode();
  const items = (cart.items ?? []).map((item) => mapLineItem(item, currencyCode));
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const metadata = cart.metadata ?? null;

  const result: Cart = {
    id: cart.id,
    email: asString(cart.email),
    customerId: asString(cart.customer_id),
    regionId: asString(cart.region_id),
    completedAt: asString(cart.completed_at),
    metadata,
    items,
    paymentSession: mapPaymentSession(cart),
    summary: {
      currencyCode,
      itemCount,
      subtotal: normalizeAmount(cart.subtotal),
      total: normalizeAmount(cart.total),
      taxTotal: normalizeAmount(cart.tax_total),
      shippingTotal: normalizeAmount(cart.shipping_total),
      discountTotal: normalizeAmount(cart.discount_total),
      requiresShipping: items.some((item) => item.requiresShipping),
      pickupRequestStatus:
        asString(metadata?.pickup_request_status) === "submitted" ? "submitted" : "draft",
      pickupRequestedAt: asString(metadata?.pickup_requested_at),
      pickupRequestId: asString(metadata?.pickup_request_id),
      pickupRequestNumber: asString(metadata?.pickup_request_number),
    },
  };

  if (items.length > 0 && result.summary.total === 0) {
    console.warn(
      `[Medusa Cart Warning] Cart ${cart.id} has ${items.length} items but total is 0. This might indicate missing calculated fields.`,
    );
  }

  return result;
}

export { MEDUSA_CART_FIELDS };
export type { MedusaCart, MedusaCartLineItem };
