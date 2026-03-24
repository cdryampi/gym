import { MedusaError } from "@medusajs/framework/utils"
import { ulid } from "ulid"

export type PickupRequestLineItemSnapshot = {
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

export type PickupRequestRecord = {
  id: string
  request_number: string
  cart_id: string
  customer_id: string | null
  supabase_user_id: string | null
  email: string
  notes: string | null
  status: string
  currency_code: string
  item_count: number
  subtotal: number
  total: number
  charged_currency_code: string | null
  charged_total: number | null
  exchange_rate: number | null
  exchange_rate_source: string | null
  exchange_rate_reference: string | null
  line_items_snapshot: PickupRequestLineItemSnapshot[]
  source: string
  order_id: string | null
  payment_collection_id: string | null
  payment_provider: string | null
  payment_status: string
  paypal_order_id: string | null
  paypal_capture_id: string | null
  payment_authorized_at: string | null
  payment_captured_at: string | null
  email_status: string
  email_sent_at: string | null
  email_error: string | null
  created_at: string
  updated_at: string
}

export type SyncPickupRequestFromOrderStepInput = {
  order_id: string
  cart_id: string
  supabase_user_id?: string | null
  notes?: string | null
}

export type QueryGraph = {
  graph: (input: {
    entity: string
    fields: string[]
    filters: Record<string, unknown>
  }) => Promise<{ data: Array<Record<string, unknown>> }>
}

export type PgConnection = {
  raw: (
    sql: string,
    bindings?: unknown[]
  ) => Promise<{ rows?: Array<Record<string, unknown>> }>
}

export type OrderSnapshot = {
  id: string
  display_id: number | null
  email: string | null
  customer_id: string | null
  currency_code: string | null
  subtotal: number
  total: number
  created_at: string | null
  updated_at: string | null
  items: Array<Record<string, unknown>>
}

export function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export function asNumber(value: unknown) {
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

export function normalizeMoneyAmount(value: unknown) {
  return asNumber(value) / 100
}

export function asIsoString(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return asString(value)
}

export function asJsonRecord(value: unknown) {
  if (!value) {
    return null
  }

  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value))
    } catch {
      return null
    }
  }

  return asRecord(value)
}

export function mapSelectedOptions(values: unknown) {
  const normalizedValues = asJsonRecord(values) ?? values

  if (!normalizedValues || typeof normalizedValues !== "object" || Array.isArray(normalizedValues)) {
    return [] as PickupRequestLineItemSnapshot["selected_options"]
  }

  return Object.entries(normalizedValues as Record<string, unknown>).reduce<
    PickupRequestLineItemSnapshot["selected_options"]
  >((allOptions, [optionTitle, value]) => {
    const normalizedValue = asString(value)

    if (!normalizedValue) {
      return allOptions
    }

    allOptions.push({
      option_title: optionTitle,
      value: normalizedValue,
    })

    return allOptions
  }, [])
}

export function asPickupRequestRecord(value: unknown): PickupRequestRecord {
  const record = asRecord(value)

  if (!record?.id || !record.request_number) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Pickup request not created correctly."
    )
  }

  return {
    id: asString(record.id) ?? "",
    request_number: asString(record.request_number) ?? "",
    cart_id: asString(record.cart_id) ?? "",
    customer_id: asString(record.customer_id),
    supabase_user_id: asString(record.supabase_user_id),
    email: asString(record.email) ?? "",
    notes: asString(record.notes),
    status: asString(record.status) ?? "requested",
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
      ? (record.line_items_snapshot as PickupRequestLineItemSnapshot[])
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
    email_status: asString(record.email_status) ?? "pending",
    email_sent_at: asIsoString(record.email_sent_at),
    email_error: asString(record.email_error),
    created_at: asIsoString(record.created_at) ?? new Date(0).toISOString(),
    updated_at: asIsoString(record.updated_at) ?? new Date(0).toISOString(),
  }
}

export function buildRequestNumber(order: Record<string, unknown>) {
  const displayId = asNumber(order.display_id)

  if (displayId > 0) {
    return `NF-PAY-${String(displayId).padStart(6, "0")}`
  }

  return `NF-PAY-${ulid().slice(-8).toUpperCase()}`
}

export function mapLineItems(
  orderItems: Array<Record<string, unknown>>,
  cartItems: Array<Record<string, unknown>>
) {
  const cartItemsByVariantId = new Map(
    cartItems
      .map((item) => {
        const variantId = asString(item.variant_id)

        if (!variantId) {
          return null
        }

        return [variantId, item] as const
      })
      .filter((entry): entry is readonly [string, Record<string, unknown>] => Boolean(entry))
  )

  return orderItems.map<PickupRequestLineItemSnapshot>((item) => {
    const variantId = asString(item.variant_id)
    const matchingCartItem = variantId ? cartItemsByVariantId.get(variantId) : null

    return {
      id: asString(item.id) ?? ulid(),
      title: asString(item.title) ?? asString(item.product_title) ?? "Producto",
      quantity: asNumber(item.quantity),
      thumbnail: asString(item.thumbnail) ?? asString(matchingCartItem?.thumbnail),
      product_id: asString(item.product_id),
      product_title: asString(item.product_title),
      product_handle:
        asString(item.product_handle) ?? asString(matchingCartItem?.product_handle),
      variant_id: variantId,
      variant_title:
        asString(item.variant_title) ?? asString(matchingCartItem?.variant_title),
      variant_sku: asString(item.variant_sku) ?? asString(matchingCartItem?.variant_sku),
      unit_price: normalizeMoneyAmount(item.unit_price),
      total:
        item.total === null || item.total === undefined
          ? normalizeMoneyAmount(item.unit_price) * asNumber(item.quantity)
          : normalizeMoneyAmount(item.total),
      selected_options: mapSelectedOptions(matchingCartItem?.variant_option_values),
    }
  })
}

export async function retrieveOrderSnapshot(
  pgConnection: PgConnection,
  orderId: string
): Promise<OrderSnapshot | null> {
  const result = await pgConnection.raw(
    `
      select
        o.id,
        o.display_id,
        o.email,
        o.customer_id,
        o.currency_code,
        o.created_at,
        o.updated_at,
        os.totals,
        oi.id as order_item_id,
        oi.quantity,
        oli.id as line_id,
        oli.title,
        oli.thumbnail,
        oli.product_id,
        oli.product_title,
        oli.product_handle,
        oli.variant_id,
        oli.variant_title,
        oli.variant_sku,
        oli.unit_price,
        oli.variant_option_values
      from "order" o
      left join order_summary os
        on os.order_id = o.id
       and os.deleted_at is null
      left join order_item oi
        on oi.order_id = o.id
       and oi.deleted_at is null
      left join order_line_item oli
        on oli.id = oi.item_id
       and oli.deleted_at is null
      where o.id = ?
        and o.deleted_at is null
      order by oi.created_at asc nulls last
    `,
    [orderId]
  )

  const rows = Array.isArray(result.rows) ? result.rows : []

  if (rows.length === 0) {
    return null
  }

  const firstRow = rows[0]
  const totals = asJsonRecord(firstRow?.totals)
  const orderTotal =
    asNumber(totals?.current_order_total) ||
    asNumber(totals?.original_order_total) ||
    asNumber(totals?.accounting_total)

  return {
    id: asString(firstRow?.id) ?? orderId,
    display_id:
      firstRow?.display_id === null || firstRow?.display_id === undefined
        ? null
        : asNumber(firstRow.display_id),
    email: asString(firstRow?.email),
    customer_id: asString(firstRow?.customer_id),
    currency_code: asString(firstRow?.currency_code),
    subtotal: orderTotal,
    total: orderTotal,
    created_at: asIsoString(firstRow?.created_at),
    updated_at: asIsoString(firstRow?.updated_at),
    items: rows
      .filter((row) => asString(row.line_id))
      .map((row) => {
        const quantity = asNumber(row.quantity)
        const unitPrice = asNumber(row.unit_price)

        return {
          id: asString(row.line_id) ?? ulid(),
          title: asString(row.title) ?? asString(row.product_title) ?? "Producto",
          quantity,
          thumbnail: asString(row.thumbnail),
          product_id: asString(row.product_id),
          product_title: asString(row.product_title),
          product_handle: asString(row.product_handle),
          variant_id: asString(row.variant_id),
          variant_title: asString(row.variant_title),
          variant_sku: asString(row.variant_sku),
          unit_price: unitPrice,
          total: unitPrice * quantity,
          variant_option_values: asJsonRecord(row.variant_option_values),
        }
      }),
  }
}

export async function resolvePaymentSnapshotByCart(
  pgConnection: PgConnection,
  cartId: string
) {
  const result = await pgConnection.raw(
    `
      select
        cpc.payment_collection_id,
        pc.authorized_amount,
        pc.captured_amount,
        pc.status as payment_collection_status,
        p.id as payment_id,
        p.provider_id as payment_provider_id,
        p.data as payment_data,
        p.created_at as payment_created_at,
        p.captured_at as payment_captured_at,
        ps.id as payment_session_id,
        ps.provider_id as payment_session_provider_id,
        ps.status as payment_session_status,
        ps.authorized_at as payment_session_authorized_at,
        ps.data as payment_session_data
      from cart_payment_collection cpc
      left join payment_collection pc
        on pc.id = cpc.payment_collection_id
       and pc.deleted_at is null
      left join payment p
        on p.payment_collection_id = pc.id
       and p.deleted_at is null
      left join payment_session ps
        on ps.payment_collection_id = pc.id
       and ps.deleted_at is null
      where cpc.cart_id = ?
        and cpc.deleted_at is null
      order by p.created_at desc nulls last, ps.created_at desc nulls last
      limit 1
    `,
    [cartId]
  )

  const row = Array.isArray(result.rows) ? result.rows[0] : null

  if (!row) {
    return {
      payment_collection_id: null,
      payment_provider: null,
      payment_status: "pending",
      paypal_order_id: null,
      paypal_capture_id: null,
      payment_authorized_at: null,
      payment_captured_at: null,
      charged_currency_code: null,
      charged_total: null,
      exchange_rate: null,
      exchange_rate_source: null,
      exchange_rate_reference: null,
    }
  }

  const paymentData = asJsonRecord(row.payment_data)
  const paymentSessionData = asJsonRecord(row.payment_session_data)
  const chargedAmount =
    paymentData?.charge_amount ?? paymentSessionData?.charge_amount ?? null
  const chargedCurrencyCode =
    asString(paymentData?.charge_currency_code) ??
    asString(paymentSessionData?.charge_currency_code)
  const exchangeRate =
    paymentData?.exchange_rate ?? paymentSessionData?.exchange_rate ?? null
  const providerId =
    asString(row.payment_provider_id) ?? asString(row.payment_session_provider_id)
  const captureId =
    asString(paymentData?.capture_id) ??
    asString(asJsonRecord(paymentData?.capture)?.id) ??
    asString(row.payment_id)
  const paypalOrderId =
    asString(paymentData?.order_id) ?? asString(paymentSessionData?.order_id)
  const authorizedAt =
    asIsoString(row.payment_created_at) ?? asIsoString(row.payment_session_authorized_at)
  const capturedAt = asIsoString(row.payment_captured_at)
  const capturedAmount = asNumber(row.captured_amount)
  const authorizedAmount = asNumber(row.authorized_amount)
  const sessionStatus = asString(row.payment_session_status)?.toLowerCase()
  const collectionStatus = asString(row.payment_collection_status)?.toLowerCase()

  let paymentStatus = "pending"

  if (capturedAt || capturedAmount > 0 || captureId) {
    paymentStatus = "captured"
  } else if (authorizedAt || authorizedAmount > 0 || sessionStatus === "authorized") {
    paymentStatus = "authorized"
  } else if (sessionStatus === "error" || collectionStatus === "canceled") {
    paymentStatus = "error"
  }

  return {
    payment_collection_id: asString(row.payment_collection_id),
    payment_provider: providerId,
    payment_status: paymentStatus,
    paypal_order_id: paypalOrderId,
    paypal_capture_id: captureId,
    payment_authorized_at: authorizedAt,
    payment_captured_at: capturedAt,
    charged_currency_code: chargedCurrencyCode?.toUpperCase() ?? null,
    charged_total:
      chargedAmount === null || chargedAmount === undefined
        ? null
        : asNumber(chargedAmount) / 100,
    exchange_rate:
      exchangeRate === null || exchangeRate === undefined ? null : asNumber(exchangeRate),
    exchange_rate_source:
      asString(paymentData?.exchange_rate_source) ??
      asString(paymentSessionData?.exchange_rate_source),
    exchange_rate_reference:
      asString(paymentData?.exchange_rate_reference) ??
      asString(paymentSessionData?.exchange_rate_reference),
  }
}
