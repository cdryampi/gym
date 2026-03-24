import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

import { PICKUP_REQUEST_MODULE } from "../../modules/pickupRequest"
import {
  asPickupRequestRecord,
  asRecord,
  asString,
  buildRequestNumber,
  mapLineItems,
  normalizeMoneyAmount,
  resolvePaymentSnapshotByCart,
  retrieveOrderSnapshot,
  type PgConnection,
  type PickupRequestRecord,
  type QueryGraph,
  type SyncPickupRequestFromOrderStepInput,
} from "./sync-pickup-request-from-order.helpers"

export const syncPickupRequestFromOrderStep = createStep<
  SyncPickupRequestFromOrderStepInput,
  PickupRequestRecord,
  PickupRequestRecord | string
>(
  "sync-pickup-request-from-order",
  async (input: SyncPickupRequestFromOrderStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as QueryGraph
    const pgConnection = container.resolve(
      ContainerRegistrationKeys.PG_CONNECTION
    ) as PgConnection
    const pickupRequestService = container.resolve(PICKUP_REQUEST_MODULE) as {
      createPickupRequests: (data: Record<string, unknown>) => Promise<unknown>
      updatePickupRequests: (data: Record<string, unknown>) => Promise<unknown>
      listPickupRequests: (
        filters: Record<string, unknown>,
        config?: Record<string, unknown>
      ) => Promise<Array<Record<string, unknown>>>
      deletePickupRequests: (id: string | string[]) => Promise<void>
    }

    const order = await retrieveOrderSnapshot(pgConnection, input.order_id)

    if (!order?.id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order with id '${input.order_id}' not found.`
      )
    }

    const { data: cartData } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "metadata",
        "items.id",
        "items.thumbnail",
        "items.variant_id",
        "items.variant_title",
        "items.variant_sku",
        "items.product_handle",
        "items.variant_option_values",
      ],
      filters: {
        id: input.cart_id,
      },
    })
    const cart = asRecord(cartData[0])
    const cartMetadata = asRecord(cart?.metadata)
    const orderItems = Array.isArray(order.items) ? order.items : []

    if (orderItems.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The paid order has no items and can't be projected to a pickup request."
      )
    }

    const lineItemsSnapshot = mapLineItems(
      orderItems.map((item) => asRecord(item) ?? {}),
      Array.isArray(cart?.items) ? cart.items.map((item) => asRecord(item) ?? {}) : []
    )
    const existingByOrder = await pickupRequestService.listPickupRequests(
      { order_id: input.order_id },
      { take: 1 }
    )
    const existingByCart =
      existingByOrder[0] ||
      (
        await pickupRequestService.listPickupRequests(
          { cart_id: input.cart_id },
          { take: 1 }
        )
      )[0]
    const email = asString(order.email)

    if (!email) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The completed order doesn't have a contact email."
      )
    }

    const paymentSnapshot = await resolvePaymentSnapshotByCart(pgConnection, input.cart_id)
    const recordData = {
      request_number:
        asString(existingByCart?.request_number) ?? buildRequestNumber(order),
      cart_id: input.cart_id,
      customer_id: asString(order.customer_id),
      supabase_user_id:
        input.supabase_user_id ??
        asString(cartMetadata?.supabase_user_id) ??
        asString(existingByCart?.supabase_user_id),
      email,
      notes:
        input.notes ??
        asString(cartMetadata?.pickup_checkout_notes) ??
        asString(existingByCart?.notes),
      status: asString(existingByCart?.status) ?? "requested",
      currency_code: asString(order.currency_code)?.toUpperCase() ?? "PEN",
      item_count: lineItemsSnapshot.reduce(
        (total, item) => total + Math.max(item.quantity, 0),
        0
      ),
      subtotal: normalizeMoneyAmount(order.subtotal),
      total: normalizeMoneyAmount(order.total),
      charged_currency_code:
        paymentSnapshot.charged_currency_code ??
        asString(existingByCart?.charged_currency_code),
      charged_total:
        paymentSnapshot.charged_total ??
        (typeof existingByCart?.charged_total === "number" &&
        Number.isFinite(existingByCart.charged_total)
          ? existingByCart.charged_total
          : null),
      exchange_rate:
        paymentSnapshot.exchange_rate ??
        (typeof existingByCart?.exchange_rate === "number" &&
        Number.isFinite(existingByCart.exchange_rate)
          ? existingByCart.exchange_rate
          : null),
      exchange_rate_source:
        paymentSnapshot.exchange_rate_source ??
        asString(existingByCart?.exchange_rate_source),
      exchange_rate_reference:
        paymentSnapshot.exchange_rate_reference ??
        asString(existingByCart?.exchange_rate_reference),
      line_items_snapshot: lineItemsSnapshot,
      source: asString(existingByCart?.source) ?? "gym-storefront",
      order_id: input.order_id,
      payment_collection_id: paymentSnapshot.payment_collection_id,
      payment_provider: paymentSnapshot.payment_provider,
      payment_status: paymentSnapshot.payment_status,
      paypal_order_id: paymentSnapshot.paypal_order_id,
      paypal_capture_id: paymentSnapshot.paypal_capture_id,
      payment_authorized_at: paymentSnapshot.payment_authorized_at,
      payment_captured_at: paymentSnapshot.payment_captured_at,
      email_status: asString(existingByCart?.email_status) ?? "pending",
      email_sent_at: asString(existingByCart?.email_sent_at),
      email_error: asString(existingByCart?.email_error),
    }

    if (existingByCart?.id) {
      const updated = await pickupRequestService.updatePickupRequests({
        id: asString(existingByCart.id),
        ...recordData,
      })
      const updatedPickupRequest = asPickupRequestRecord(
        Array.isArray(updated) ? updated[0] : updated
      )

      return new StepResponse(updatedPickupRequest, updatedPickupRequest)
    }

    const created = await pickupRequestService.createPickupRequests(recordData)
    const pickupRequest = asPickupRequestRecord(Array.isArray(created) ? created[0] : created)

    return new StepResponse(pickupRequest, pickupRequest.id)
  },
  async (pickupRequest, { container }) => {
    if (!pickupRequest) {
      return
    }

    const pickupRequestService = container.resolve(PICKUP_REQUEST_MODULE) as {
      deletePickupRequests: (id: string | string[]) => Promise<void>
    }

    await pickupRequestService.deletePickupRequests(
      typeof pickupRequest === "string" ? pickupRequest : pickupRequest.id
    )
  }
)

export const __syncPickupRequestFromOrderTestables = {
  mapLineItems,
  resolvePaymentSnapshotByCart,
  retrieveOrderSnapshot,
}
