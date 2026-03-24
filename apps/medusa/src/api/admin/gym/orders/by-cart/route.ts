import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { sendJson } from "../../helpers"

type QueryGraph = {
  graph: (input: {
    entity: string
    fields: string[]
    filters: Record<string, unknown>
    options?: Record<string, unknown>
  }) => Promise<{ data: Array<Record<string, unknown>> }>
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as QueryGraph
  const cartId =
    req.query && typeof req.query.cart_id === "string" ? req.query.cart_id.trim() : null

  if (!cartId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "cart_id is required.")
  }

  const { data } = await query.graph({
    entity: "order_cart",
    fields: ["cart_id", "order_id"],
    filters: {
      cart_id: cartId,
    },
    options: {
      isList: false,
    },
  })
  const orderCart = Array.isArray(data) ? data[0] : data

  sendJson(res, {
    order: orderCart
      ? {
          id: asString(orderCart.order_id),
          display_id: null,
          cart_id: asString(orderCart.cart_id),
          created_at: null,
        }
      : null,
  })
}
