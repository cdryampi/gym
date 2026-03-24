import type {
  CartPaymentSessionStatus,
  SelectedVariant,
} from "@/lib/cart/types";

export type MedusaCartLineItem = {
  id: string;
  title?: string | null;
  thumbnail?: string | null;
  quantity: number;
  product_id?: string | null;
  product_title?: string | null;
  product_handle?: string | null;
  variant_id?: string | null;
  variant_title?: string | null;
  variant_sku?: string | null;
  unit_price?: number | null;
  subtotal?: number | null;
  total?: number | null;
  requires_shipping?: boolean | null;
  variant_option_values?: Record<string, unknown> | null;
};

export type MedusaCart = {
  id: string;
  email?: string | null;
  customer_id?: string | null;
  region_id?: string | null;
  completed_at?: string | null;
  metadata?: Record<string, unknown> | null;
  currency_code?: string | null;
  subtotal?: number | null;
  total?: number | null;
  tax_total?: number | null;
  shipping_total?: number | null;
  discount_total?: number | null;
  payment_collection?: {
    payment_sessions?: Array<Record<string, unknown>> | null;
  } | null;
  shipping_methods?: Array<{
    id: string;
    shipping_option_id?: string | null;
  }> | null;
  items?: MedusaCartLineItem[] | null;
};

export type MedusaShippingOption = {
  id: string;
  name?: string | null;
};

export type MedusaStoreOrder = Record<string, unknown> & {
  id?: string | null;
  display_id?: number | null;
};

export type CompleteCartResult =
  | {
      type: "order";
      order: MedusaStoreOrder;
    }
  | {
      type: "cart";
      cart: MedusaCart;
      error: string | null;
    };

export const MEDUSA_CART_FIELDS =
  "id,currency_code,email,subtotal,total,tax_total,shipping_total,discount_total,region_id,completed_at,metadata,*payment_collection,*payment_collection.payment_sessions,shipping_methods.id,shipping_methods.shipping_option_id,items.id,items.unit_price,items.subtotal,items.total,items.quantity,items.title,items.thumbnail,items.product_id,items.product_title,items.product_handle,items.variant_id,items.variant_sku,items.variant_title,items.requires_shipping,items.variant_option_values";

export function normalizeAmount(amount: number | null | undefined) {
  return typeof amount === "number" && Number.isFinite(amount) ? amount / 100 : 0;
}

export function normalizeOptionalAmount(amount: number | null | undefined) {
  return typeof amount === "number" && Number.isFinite(amount) ? amount / 100 : null;
}

export function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export function mapSelectedOptions(
  values: Record<string, unknown> | null | undefined,
): SelectedVariant[] {
  if (!values || typeof values !== "object") {
    return [];
  }

  return Object.entries(values).reduce<SelectedVariant[]>(
    (selectedOptions, [optionTitle, value]) => {
      const normalizedValue = asString(value);

      if (!normalizedValue) {
        return selectedOptions;
      }

      selectedOptions.push({
        optionTitle,
        value: normalizedValue,
      });

      return selectedOptions;
    },
    [],
  );
}

export function normalizePaymentSessionStatus(value: unknown): CartPaymentSessionStatus {
  switch (value) {
    case "authorized":
    case "captured":
    case "pending":
    case "requires_more":
    case "canceled":
      return value;
    default:
      return "error";
  }
}

export function toCartError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message && error.message !== "An unknown error occurred.") {
    return error.message;
  }

  if (error && typeof error === "object" && !Array.isArray(error)) {
    const record = error as Record<string, unknown>;
    const status =
      typeof record.status === "number" && Number.isFinite(record.status)
        ? record.status
        : null;
    const statusText = asString(record.statusText);

    if (status || statusText) {
      return [fallbackMessage, status, statusText].filter(Boolean).join(" - ");
    }
  }

  return fallbackMessage;
}

export function isCheckoutConflictError(error: unknown) {
  const message = toCartError(error, "").toLowerCase();

  return (
    message.includes("conflicted with another request") ||
    message.includes("already being completed by another request") ||
    message.includes("failed to acquire lock") ||
    message.includes("idempotency-key") ||
    message.includes("another request")
  );
}
