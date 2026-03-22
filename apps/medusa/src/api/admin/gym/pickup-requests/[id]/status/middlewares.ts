import type { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformBody } from "@medusajs/framework/http"
import { z } from "zod"

import { pickupRequestStatuses } from "../../../../../../modules/pickupRequest/constants"

export const UpdatePickupRequestStatusSchema = z.object({
  status: z.enum(pickupRequestStatuses),
})

export type UpdatePickupRequestStatusSchema = z.infer<
  typeof UpdatePickupRequestStatusSchema
>

export const pickupRequestStatusMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/gym/pickup-requests/:id/status",
    method: "POST",
    middlewares: [validateAndTransformBody(UpdatePickupRequestStatusSchema)],
  },
]
