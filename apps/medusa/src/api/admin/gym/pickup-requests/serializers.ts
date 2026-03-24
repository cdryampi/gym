import type {
  PickupRequestEmailStatus,
  PickupRequestStatus,
} from "../../../../modules/pickupRequest/constants"

export type AdminPickupRequestLineItem = {
  id: string
  title: string
  quantity: number
  thumbnail: string | null
  product_id: string | null
  product_title: string | null
  product_handle: string | null
  variant_id: string | null
  variant_title: string | null
  variant_sku: string | null
  unit_price: number
  total: number
  selected_options: Array<{
    option_title: string
    value: string
  }>
}

export type AdminPickupRequestRecord = {
  id: string
  request_number: string
  cart_id: string
  customer_id: string | null
  supabase_user_id: string | null
  email: string
  notes: string | null
  status: PickupRequestStatus
  currency_code: string
  item_count: number
  subtotal: number
  total: number
  charged_currency_code: string | null
  charged_total: number | null
  exchange_rate: number | null
  exchange_rate_source: string | null
  exchange_rate_reference: string | null
  line_items_snapshot: AdminPickupRequestLineItem[]
  source: string
  order_id: string | null
  payment_collection_id: string | null
  payment_provider: string | null
  payment_status: string
  paypal_order_id: string | null
  paypal_capture_id: string | null
  payment_authorized_at: string | null
  payment_captured_at: string | null
  email_status: PickupRequestEmailStatus
  email_sent_at: string | null
  email_error: string | null
  created_at: string
  updated_at: string
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

function asIsoString(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return asString(value)
}

function mapLineItemSnapshot(value: unknown): AdminPickupRequestLineItem | null {
  const record = asRecord(value)

  if (!record?.id) {
    return null
  }

  const selectedOptions = Array.isArray(record.selected_options)
    ? record.selected_options.reduce<AdminPickupRequestLineItem["selected_options"]>(
        (allOptions, option) => {
          const optionRecord = asRecord(option)
          const optionTitle = asString(optionRecord?.option_title)
          const optionValue = asString(optionRecord?.value)

          if (!optionTitle || !optionValue) {
            return allOptions
          }

          allOptions.push({
            option_title: optionTitle,
            value: optionValue,
          })

          return allOptions
        },
        []
      )
    : []

  return {
    id: asString(record.id) ?? "",
    title: asString(record.title) ?? "Producto",
    quantity: asNumber(record.quantity),
    thumbnail: asString(record.thumbnail),
    product_id: asString(record.product_id),
    product_title: asString(record.product_title),
    product_handle: asString(record.product_handle),
    variant_id: asString(record.variant_id),
    variant_title: asString(record.variant_title),
    variant_sku: asString(record.variant_sku),
    unit_price: asNumber(record.unit_price),
    total: asNumber(record.total),
    selected_options: selectedOptions,
  }
}

export function serializePickupRequest(value: unknown): AdminPickupRequestRecord {
  const record = asRecord(value)

  if (!record?.id || !record.request_number) {
    throw new Error("Pickup request payload is invalid.")
  }

  return {
    id: asString(record.id) ?? "",
    request_number: asString(record.request_number) ?? "",
    cart_id: asString(record.cart_id) ?? "",
    customer_id: asString(record.customer_id),
    supabase_user_id: asString(record.supabase_user_id),
    email: asString(record.email) ?? "",
    notes: asString(record.notes),
    status: (asString(record.status) as PickupRequestStatus | null) ?? "requested",
    currency_code: asString(record.currency_code) ?? "PEN",
    item_count: asNumber(record.item_count),
    subtotal: asNumber(record.subtotal),
    total: asNumber(record.total),
    charged_currency_code: asString(record.charged_currency_code),
    charged_total:
      record.charged_total === null || record.charged_total === undefined
        ? null
        : asNumber(record.charged_total),
    exchange_rate:
      record.exchange_rate === null || record.exchange_rate === undefined
        ? null
        : asNumber(record.exchange_rate),
    exchange_rate_source: asString(record.exchange_rate_source),
    exchange_rate_reference: asString(record.exchange_rate_reference),
    line_items_snapshot: Array.isArray(record.line_items_snapshot)
      ? record.line_items_snapshot
          .map((lineItem) => mapLineItemSnapshot(lineItem))
          .filter((lineItem): lineItem is AdminPickupRequestLineItem => Boolean(lineItem))
      : [],
    source: asString(record.source) ?? "gym-storefront",
    order_id: asString(record.order_id),
    payment_collection_id: asString(record.payment_collection_id),
    payment_provider: asString(record.payment_provider),
    payment_status: asString(record.payment_status) ?? "pending",
    paypal_order_id: asString(record.paypal_order_id),
    paypal_capture_id: asString(record.paypal_capture_id),
    payment_authorized_at: asIsoString(record.payment_authorized_at),
    payment_captured_at: asIsoString(record.payment_captured_at),
    email_status:
      (asString(record.email_status) as PickupRequestEmailStatus | null) ?? "pending",
    email_sent_at: asIsoString(record.email_sent_at),
    email_error: asString(record.email_error),
    created_at: asIsoString(record.created_at) ?? new Date(0).toISOString(),
    updated_at: asIsoString(record.updated_at) ?? new Date(0).toISOString(),
  }
}
