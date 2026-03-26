import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"

import { syncPickupRequestFromOrderStep } from "./steps/sync-pickup-request-from-order"

export type SyncPickupRequestFromOrderWorkflowInput = {
  cart_id: string
  order_id?: string | null
  paypal_order_id?: string | null
  supabase_user_id?: string | null
  notes?: string | null
}

const syncPickupRequestFromOrderWorkflow = createWorkflow(
  "sync-pickup-request-from-order-workflow",
  function (input: SyncPickupRequestFromOrderWorkflowInput) {
    const pickupRequest = syncPickupRequestFromOrderStep(input)

    return new WorkflowResponse({
      pickupRequest,
    })
  }
)

export default syncPickupRequestFromOrderWorkflow
