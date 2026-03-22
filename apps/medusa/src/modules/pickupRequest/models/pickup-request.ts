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
  line_items_snapshot: model.json(),
  source: model.text().default("gym-storefront"),
  email_status: model.enum([...pickupRequestEmailStatuses]).default("pending"),
  email_sent_at: model.dateTime().nullable(),
  email_error: model.text().nullable(),
})

export default PickupRequest
