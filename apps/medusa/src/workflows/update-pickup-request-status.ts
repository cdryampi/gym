import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { updatePickupRequestStatusStep } from "./steps/update-pickup-request-status"
import type { PickupRequestStatus } from "../modules/pickupRequest/constants"

type UpdatePickupRequestStatusWorkflowInput = {
  id: string
  status: PickupRequestStatus
}

const updatePickupRequestStatusWorkflow = createWorkflow(
  "update-pickup-request-status-workflow",
  function (input: UpdatePickupRequestStatusWorkflowInput) {
    const pickupRequest = updatePickupRequestStatusStep(input)

    return new WorkflowResponse({
      pickupRequest,
    })
  }
)

export default updatePickupRequestStatusWorkflow
