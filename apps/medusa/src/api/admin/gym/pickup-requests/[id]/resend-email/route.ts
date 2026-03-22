import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import updatePickupRequestEmailWorkflow from "../../../../../../workflows/update-pickup-request-email"
import { sendJson } from "../../../helpers"
import { serializePickupRequest } from "../../serializers"
import type { UpdatePickupRequestEmailSchema } from "./middlewares"

export async function POST(
  req: AuthenticatedMedusaRequest<UpdatePickupRequestEmailSchema>,
  res: MedusaResponse
) {
  const { result } = await updatePickupRequestEmailWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      email_status: req.validatedBody.email_status,
      email_error: req.validatedBody.email_error ?? null,
      email_sent_at: req.validatedBody.email_sent_at ?? null,
    },
  })

  sendJson(res, {
    pickup_request: serializePickupRequest(result.pickupRequest),
  })
}
