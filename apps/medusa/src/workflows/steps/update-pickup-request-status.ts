import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

import { PICKUP_REQUEST_MODULE } from "../../modules/pickupRequest"
import type { PickupRequestStatus } from "../../modules/pickupRequest/constants"

type UpdatePickupRequestStatusStepInput = {
  id: string
  status: PickupRequestStatus
}

export const updatePickupRequestStatusStep = createStep(
  "update-pickup-request-status",
  async (input: UpdatePickupRequestStatusStepInput, { container }) => {
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
      status: input.status,
    })

    return new StepResponse(Array.isArray(updated) ? updated[0] : updated, {
      id: input.id,
      previous_status: currentPickupRequest.status,
    })
  },
  async (compensationInput, { container }) => {
    if (!compensationInput?.id || !compensationInput.previous_status) {
      return
    }

    const pickupRequestService = container.resolve(PICKUP_REQUEST_MODULE) as {
      updatePickupRequests: (data: Record<string, unknown>) => Promise<unknown>
    }

    await pickupRequestService.updatePickupRequests({
      id: compensationInput.id,
      status: compensationInput.previous_status,
    })
  }
)
