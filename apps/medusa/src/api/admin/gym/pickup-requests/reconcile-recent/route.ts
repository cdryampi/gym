import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import syncPickupRequestFromOrderWorkflow from "../../../../../workflows/sync-pickup-request-from-order"
import { sendJson } from "../../helpers"
import { serializePickupRequest } from "../serializers"
import type { ReconcileRecentPickupRequestsSchema } from "./middlewares"

type PgConnection = {
  raw: (
    sql: string,
    bindings?: unknown[]
  ) => Promise<{ rows?: Array<Record<string, unknown>> }>
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export const AUTHENTICATE = false

export async function POST(
  req: AuthenticatedMedusaRequest<ReconcileRecentPickupRequestsSchema>,
  res: MedusaResponse
) {
  const pgConnection = req.scope.resolve(
    ContainerRegistrationKeys.PG_CONNECTION
  ) as PgConnection
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as {
    info: (message: string) => void
    warn: (message: string) => void
  }
  const hours = req.validatedBody.hours ?? 24
  const limit = req.validatedBody.limit ?? 25
  const email = req.validatedBody.email?.trim().toLowerCase() ?? null

  const result = await pgConnection.raw(
    `
      select distinct
        o.id as order_id,
        oc.cart_id,
        o.email
      from "order" o
      inner join order_cart oc
        on oc.order_id = o.id
      left join pickup_request pr
        on pr.order_id = o.id
       and pr.deleted_at is null
      where o.deleted_at is null
        and pr.id is null
        and o.created_at >= now() - (? * interval '1 hour')
        and (? is null or lower(o.email) = ?)
      order by o.created_at desc
      limit ?
    `,
    [hours, email, email, limit]
  )

  const rows = Array.isArray(result.rows) ? result.rows : []
  const pickupRequests: Array<Record<string, unknown>> = []

  for (const row of rows) {
    const orderId = asString(row.order_id)
    const cartId = asString(row.cart_id)

    if (!orderId || !cartId) {
      continue
    }

    try {
      const workflowResult = await syncPickupRequestFromOrderWorkflow(req.scope).run({
        input: {
          order_id: orderId,
          cart_id: cartId,
        },
      })

      pickupRequests.push(workflowResult.result.pickupRequest)
    } catch (error) {
      logger.warn(
        `[PICKUP RECONCILE] order_id=${orderId} cart_id=${cartId} failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  logger.info(
    `[PICKUP RECONCILE] hours=${hours} limit=${limit} email=${email ?? "all"} reconciled=${pickupRequests.length}`
  )

  sendJson(res, {
    pickup_requests: pickupRequests.map((pickupRequest) =>
      serializePickupRequest(pickupRequest)
    ),
    reconciled_count: pickupRequests.length,
  })
}
