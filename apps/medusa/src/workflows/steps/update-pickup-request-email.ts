import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

import { PICKUP_REQUEST_MODULE } from "../../modules/pickupRequest"
import type { PickupRequestEmailStatus } from "../../modules/pickupRequest/constants"

type UpdatePickupRequestEmailStepInput = {
  id: string
  email_status: PickupRequestEmailStatus
  email_error?: string | null
  email_sent_at?: string | null
}

export const updatePickupRequestEmailStep = createStep(
  "update-pickup-request-email",
  async (input: UpdatePickupRequestEmailStepInput, { container }) => {
    const pickupRequestService = container.resolve(PICKUP_REQUEST_MODULE) as {
      retrievePickupRequest: (id: string) => Promise<Record<string, unknown> | null>
      updatePickupRequests: (data: Record<string, unknown>) => Promise<unknown>
    }

    const currentPickupRequest = await pickupRequestService.retrievePickupRequest(input.id)

    if (!currentPickupRequest?.id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Pickup request with id '${input.id}' not found.`
      )
    }

    const updated = await pickupRequestService.updatePickupRequests({
      id: input.id,
      email_status: input.email_status,
      email_sent_at:
        input.email_status === "sent"
          ? input.email_sent_at ?? new Date().toISOString()
          : null,
      email_error:
        input.email_status === "failed" ? input.email_error ?? "Email failed." : null,
    })

    return new StepResponse(Array.isArray(updated) ? updated[0] : updated, {
      id: input.id,
      previous_email_status: currentPickupRequest.email_status,
      previous_email_sent_at: currentPickupRequest.email_sent_at,
      previous_email_error: currentPickupRequest.email_error,
    })
  },
  async (compensationInput, { container }) => {
    if (!compensationInput?.id) {
      return
    }

    const pickupRequestService = container.resolve(PICKUP_REQUEST_MODULE) as {
      updatePickupRequests: (data: Record<string, unknown>) => Promise<unknown>
    }

    await pickupRequestService.updatePickupRequests({
      id: compensationInput.id,
      email_status: compensationInput.previous_email_status ?? "pending",
      email_sent_at: compensationInput.previous_email_sent_at ?? null,
      email_error: compensationInput.previous_email_error ?? null,
    })
  }
)
