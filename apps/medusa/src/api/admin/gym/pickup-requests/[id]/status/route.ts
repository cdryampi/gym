import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import updatePickupRequestStatusWorkflow from "../../../../../../workflows/update-pickup-request-status"
import { sendJson } from "../../../helpers"
import { serializePickupRequest } from "../../serializers"
import type { UpdatePickupRequestStatusSchema } from "./middlewares"

export async function POST(
  req: AuthenticatedMedusaRequest<UpdatePickupRequestStatusSchema>,
  res: MedusaResponse
) {
  const { result } = await updatePickupRequestStatusWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      status: req.validatedBody.status,
    },
  })

  sendJson(res, {
    pickup_request: serializePickupRequest(result.pickupRequest),
  })
}
