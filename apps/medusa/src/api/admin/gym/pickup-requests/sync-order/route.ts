import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import syncPickupRequestFromOrderWorkflow from "../../../../../workflows/sync-pickup-request-from-order"
import { sendJson } from "../../helpers"
import { serializePickupRequest } from "../serializers"
import type { SyncPickupRequestFromOrderSchema } from "./middlewares"

export async function POST(
  req: AuthenticatedMedusaRequest<SyncPickupRequestFromOrderSchema>,
  res: MedusaResponse
) {
  const { result } = await syncPickupRequestFromOrderWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  sendJson(res, {
    pickup_request: serializePickupRequest(result.pickupRequest),
  })
}
