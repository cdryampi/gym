import { model } from "@medusajs/framework/utils"

import {
  pickupRequestEmailStatuses,
  pickupRequestStatuses,
} from "../constants"

const PickupRequest = model.define("pickup_request", {
  id: model.id().primaryKey(),
  request_number: model.text().unique(),
  cart_id: model.text().unique(),
  customer_id: model.text().nullable(),
  supabase_user_id: model.text().nullable(),
  email: model.text(),
  notes: model.text().nullable(),
  status: model.enum([...pickupRequestStatuses]).default("requested"),
  currency_code: model.text(),
  item_count: model.number(),
  subtotal: model.float(),
  total: model.float(),
  charged_currency_code: model.text().nullable(),
  charged_total: model.float().nullable(),
  exchange_rate: model.float().nullable(),
  exchange_rate_source: model.text().nullable(),
  exchange_rate_reference: model.text().nullable(),
  line_items_snapshot: model.json(),
  source: model.text().default("gym-storefront"),
  order_id: model.text().nullable(),
  payment_collection_id: model.text().nullable(),
  payment_provider: model.text().nullable(),
  payment_status: model.text().default("pending"),
  paypal_order_id: model.text().nullable(),
  paypal_capture_id: model.text().nullable(),
  payment_authorized_at: model.dateTime().nullable(),
  payment_captured_at: model.dateTime().nullable(),
  email_status: model.enum([...pickupRequestEmailStatuses]).default("pending"),
  email_sent_at: model.dateTime().nullable(),
  email_error: model.text().nullable(),
})

export default PickupRequest
