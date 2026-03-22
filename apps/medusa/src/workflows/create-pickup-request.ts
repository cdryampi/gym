import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { createPickupRequestStep } from "./steps/create-pickup-request"

type CreatePickupRequestWorkflowInput = {
  cart_id: string
  email: string
  customer_id?: string | null
  supabase_user_id?: string | null
  notes?: string | null
}

const createPickupRequestWorkflow = createWorkflow(
  "create-pickup-request-workflow",
  function (input: CreatePickupRequestWorkflowInput) {
    const pickupRequest = createPickupRequestStep(input)

    return new WorkflowResponse({
      pickupRequest,
    })
  }
)

export default createPickupRequestWorkflow
