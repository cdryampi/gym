import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import createPickupRequestWorkflow from "../../../../workflows/create-pickup-request"
import { PICKUP_REQUEST_MODULE } from "../../../../modules/pickupRequest"
import {
  pickupRequestStatuses,
  type PickupRequestStatus,
} from "../../../../modules/pickupRequest/constants"
import { sendJson } from "../helpers"
import { serializePickupRequest } from "./serializers"
import type { CreatePickupRequestSchema } from "./middlewares"

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function normalizeStatus(value: string | null) {
  return pickupRequestStatuses.includes(value as PickupRequestStatus)
    ? (value as PickupRequestStatus)
    : null
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pickupRequestService = req.scope.resolve(PICKUP_REQUEST_MODULE) as {
    listAndCountPickupRequests: (
      filters?: Record<string, unknown>,
      config?: Record<string, unknown>
    ) => Promise<[Array<Record<string, unknown>>, number]>
  }
  const query = req.query as Record<string, string | undefined>
  const status = normalizeStatus(query.status || null)
  const email = query.email?.trim() || null
  const cartId = query.cart_id?.trim() || null
  const customerId = query.customer_id?.trim() || null
  const supabaseUserId = query.supabase_user_id?.trim() || null
  const limit = parsePositiveInt(query.limit ?? null, 20)
  const offset = parsePositiveInt(query.offset ?? null, 0)
  const filters: Record<string, unknown> = {}

  if (status) {
    filters.status = status
  }

  if (email) {
    filters.email = email
  }

  if (cartId) {
    filters.cart_id = cartId
  }

  if (customerId) {
    filters.customer_id = customerId
  }

  if (supabaseUserId) {
    filters.supabase_user_id = supabaseUserId
  }

  const [pickupRequests, count] = await pickupRequestService.listAndCountPickupRequests(
    filters,
    {
      take: limit,
      skip: offset,
      order: {
        created_at: "DESC",
      },
    }
  )

  sendJson(res, {
    pickup_requests: pickupRequests.map((pickupRequest) =>
      serializePickupRequest(pickupRequest)
    ),
    count,
    limit,
    offset,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreatePickupRequestSchema>,
  res: MedusaResponse
) {
  const { result } = await createPickupRequestWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  sendJson(res, {
    pickup_request: serializePickupRequest(result.pickupRequest),
  })
}
