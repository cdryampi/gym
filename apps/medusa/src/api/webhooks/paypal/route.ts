import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import syncPickupRequestFromOrderWorkflow from "../../../workflows/sync-pickup-request-from-order"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  try {
    const event = req.body as any
    const resource = event.resource || {}
    const cartId = resource.custom_id || resource.invoice_id
    
    if (!cartId || event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
       return res.sendStatus(200)
    }

    logger.info(`[PAYPAL WEBHOOK] Received capture completion for cart: ${cartId}`)

    // Find the order associated with this cart
    // Using a more generic query to avoid strict filter typing issues if cart_id is being finicky
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "cart_id"],
      filters: {
        // @ts-ignore - cart_id is the standard field but typing can be restrictive in some SDK versions
        cart_id: cartId,
      },
    })

    const order = orders[0]

    if (!order) {
      // It's possible the webhook arrived BEFORE the cart was completed on the main thread.
      // In a real production system, we'd want to retry this or wait.
      // For now, we'll log it clearly.
      logger.warn(`[PAYPAL WEBHOOK] No order found for cart ${cartId} yet. The cart might not be completed in Medusa yet.`)
      return res.sendStatus(200)
    }

    logger.info(`[PAYPAL WEBHOOK] Found order ${order.id} for cart ${cartId}. Starting sync...`)

    // Trigger the workflow
    await syncPickupRequestFromOrderWorkflow(req.scope).run({
      input: {
        order_id: order.id as string,
        cart_id: cartId as string,
      },
    })

    logger.info(`[PAYPAL WEBHOOK] Successfully synchronized order ${order.id}`)
    
    res.sendStatus(200)
  } catch (error) {
    logger.error(`[PAYPAL WEBHOOK] Error processing webhook: ${error instanceof Error ? error.message : String(error)}`)
    res.sendStatus(500)
  }
}
