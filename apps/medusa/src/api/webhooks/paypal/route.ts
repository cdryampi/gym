import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import syncPickupRequestFromOrderWorkflow from "../../../workflows/sync-pickup-request-from-order"

type PgConnection = {
  raw: (
    sql: string,
    bindings?: unknown[]
  ) => Promise<{ rows?: Array<Record<string, unknown>> }>
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const pgConnection = req.scope.resolve(
    ContainerRegistrationKeys.PG_CONNECTION
  ) as PgConnection
  
  try {
    const event = req.body as any
    const resource = event.resource || {}
    const sessionId = asString(resource.custom_id) || asString(resource.invoice_id)
    
    if (!sessionId || event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
       return res.sendStatus(200)
    }

    logger.info(`[PAYPAL WEBHOOK] Received capture completion for payment_session: ${sessionId}`)

    const sessionResult = await pgConnection.raw(
      `
        select
          cpc.cart_id,
          oc.order_id
        from payment_session ps
        inner join cart_payment_collection cpc
          on cpc.payment_collection_id = ps.payment_collection_id
         and cpc.deleted_at is null
        left join order_cart oc
          on oc.cart_id = cpc.cart_id
        where ps.id = ?
          and ps.deleted_at is null
        limit 1
      `,
      [sessionId]
    )
    const sessionRow = Array.isArray(sessionResult.rows) ? sessionResult.rows[0] : null
    const cartId = asString(sessionRow?.cart_id)
    const orderId = asString(sessionRow?.order_id)

    if (!cartId) {
      logger.warn(`[PAYPAL WEBHOOK] No cart found for payment_session ${sessionId}.`)
      return res.sendStatus(200)
    }

    if (!orderId) {
      logger.warn(
        `[PAYPAL WEBHOOK] Cart ${cartId} resolved from session ${sessionId}, but no Medusa order is linked yet.`
      )
      return res.sendStatus(200)
    }

    logger.info(
      `[PAYPAL WEBHOOK] Resolved payment_session ${sessionId} -> cart ${cartId} -> order ${orderId}. Starting sync...`
    )

    await syncPickupRequestFromOrderWorkflow(req.scope).run({
      input: {
        order_id: orderId,
        cart_id: cartId,
        paypal_order_id: asString(resource.id),
      },
    })

    logger.info(`[PAYPAL WEBHOOK] Successfully synchronized order ${orderId}`)
    
    res.sendStatus(200)
  } catch (error) {
    logger.error(`[PAYPAL WEBHOOK] Error processing webhook: ${error instanceof Error ? error.message : String(error)}`)
    res.sendStatus(500)
  }
}
