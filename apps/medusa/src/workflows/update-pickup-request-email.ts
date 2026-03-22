import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { updatePickupRequestEmailStep } from "./steps/update-pickup-request-email"
import type { PickupRequestEmailStatus } from "../modules/pickupRequest/constants"

type UpdatePickupRequestEmailWorkflowInput = {
  id: string
  email_status: PickupRequestEmailStatus
  email_error?: string | null
  email_sent_at?: string | null
}

const updatePickupRequestEmailWorkflow = createWorkflow(
  "update-pickup-request-email-workflow",
  function (input: UpdatePickupRequestEmailWorkflowInput) {
    const pickupRequest = updatePickupRequestEmailStep(input)

    return new WorkflowResponse({
      pickupRequest,
    })
  }
)

export default updatePickupRequestEmailWorkflow
