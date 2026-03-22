import type {
  PickupRequestDetail,
  PickupRequestEmailStatus,
  PickupRequestLineItem,
  PickupRequestStatus,
  SelectedVariant,
} from "@/lib/cart/types";

export type MedusaPickupRequestLineItem = {
  id: string;
  title?: string | null;
  quantity?: number | null;
  thumbnail?: string | null;
  product_id?: string | null;
  product_title?: string | null;
  product_handle?: string | null;
  variant_id?: string | null;
  variant_title?: string | null;
  variant_sku?: string | null;
  unit_price?: number | null;
  total?: number | null;
  selected_options?: Array<{
    option_title?: string | null;
    value?: string | null;
  }> | null;
};

export type MedusaPickupRequest = {
  id: string;
  request_number?: string | null;
  cart_id?: string | null;
  customer_id?: string | null;
  supabase_user_id?: string | null;
  email?: string | null;
  notes?: string | null;
  status?: string | null;
  currency_code?: string | null;
  item_count?: number | null;
  subtotal?: number | null;
  total?: number | null;
  line_items_snapshot?: MedusaPickupRequestLineItem[] | null;
  source?: string | null;
  email_status?: string | null;
  email_sent_at?: string | null;
  email_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export const pickupRequestStatusLabels: Record<PickupRequestStatus, string> = {
  requested: "Solicitado",
  confirmed: "Confirmado",
  ready_for_pickup: "Listo para recoger",
  fulfilled: "Entregado",
  cancelled: "Cancelado",
};

export const pickupRequestEmailStatusLabels: Record<PickupRequestEmailStatus, string> = {
  pending: "Pendiente",
  sent: "Enviado",
  failed: "Fallido",
};

export function getPickupRequestStatusTone(status: PickupRequestStatus) {
  switch (status) {
    case "confirmed":
      return "default" as const;
    case "ready_for_pickup":
      return "success" as const;
    case "fulfilled":
      return "muted" as const;
    case "cancelled":
      return "warning" as const;
    case "requested":
    default:
      return "warning" as const;
  }
}

export function getPickupRequestEmailTone(status: PickupRequestEmailStatus) {
  switch (status) {
    case "sent":
      return "success" as const;
    case "failed":
      return "warning" as const;
    case "pending":
    default:
      return "muted" as const;
  }
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function normalizePickupRequestStatus(value: unknown): PickupRequestStatus {
  switch (value) {
    case "confirmed":
    case "ready_for_pickup":
    case "fulfilled":
    case "cancelled":
      return value;
    case "requested":
    default:
      return "requested";
  }
}

export function normalizePickupRequestEmailStatus(value: unknown): PickupRequestEmailStatus {
  switch (value) {
    case "sent":
    case "failed":
      return value;
    case "pending":
    default:
      return "pending";
  }
}

function mapSelectedOptions(
  selectedOptions: MedusaPickupRequestLineItem["selected_options"],
): SelectedVariant[] {
  if (!Array.isArray(selectedOptions)) {
    return [];
  }

  return selectedOptions.reduce<SelectedVariant[]>((allOptions, option) => {
    const optionTitle = asString(option?.option_title);
    const value = asString(option?.value);

    if (!value) {
      return allOptions;
    }

    allOptions.push({
      optionTitle: optionTitle ?? undefined,
      value,
    });

    return allOptions;
  }, []);
}

function mapLineItem(lineItem: MedusaPickupRequestLineItem): PickupRequestLineItem {
  return {
    id: lineItem.id,
    title: asString(lineItem.title) ?? "Producto",
    quantity: asNumber(lineItem.quantity),
    thumbnail: asString(lineItem.thumbnail),
    productId: asString(lineItem.product_id),
    productTitle: asString(lineItem.product_title),
    productHandle: asString(lineItem.product_handle),
    variantId: asString(lineItem.variant_id),
    variantTitle: asString(lineItem.variant_title),
    variantSku: asString(lineItem.variant_sku),
    unitPrice: asNumber(lineItem.unit_price),
    total: asNumber(lineItem.total),
    selectedOptions: mapSelectedOptions(lineItem.selected_options),
  };
}

export function mapPickupRequest(pickupRequest: MedusaPickupRequest): PickupRequestDetail {
  return {
    id: pickupRequest.id,
    requestNumber: asString(pickupRequest.request_number) ?? pickupRequest.id,
    cartId: asString(pickupRequest.cart_id) ?? "",
    customerId: asString(pickupRequest.customer_id),
    supabaseUserId: asString(pickupRequest.supabase_user_id),
    email: asString(pickupRequest.email) ?? "",
    notes: asString(pickupRequest.notes),
    status: normalizePickupRequestStatus(pickupRequest.status),
    currencyCode: asString(pickupRequest.currency_code)?.toUpperCase() ?? "PEN",
    itemCount: asNumber(pickupRequest.item_count),
    subtotal: asNumber(pickupRequest.subtotal),
    total: asNumber(pickupRequest.total),
    lineItems: Array.isArray(pickupRequest.line_items_snapshot)
      ? pickupRequest.line_items_snapshot.map((lineItem) => mapLineItem(lineItem))
      : [],
    source: asString(pickupRequest.source) ?? "gym-storefront",
    emailStatus: normalizePickupRequestEmailStatus(pickupRequest.email_status),
    emailSentAt: asString(pickupRequest.email_sent_at),
    emailError: asString(pickupRequest.email_error),
    createdAt: asString(pickupRequest.created_at) ?? new Date(0).toISOString(),
    updatedAt: asString(pickupRequest.updated_at) ?? new Date(0).toISOString(),
  };
}
