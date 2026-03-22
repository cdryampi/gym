import type { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformBody } from "@medusajs/framework/http"
import { z } from "zod"

import { pickupRequestEmailStatuses } from "../../../../../../modules/pickupRequest/constants"

export const UpdatePickupRequestEmailSchema = z.object({
  email_status: z.enum(pickupRequestEmailStatuses),
  email_error: z.string().trim().max(2000).optional(),
  email_sent_at: z.string().datetime().optional(),
})

export type UpdatePickupRequestEmailSchema = z.infer<
  typeof UpdatePickupRequestEmailSchema
>

export const pickupRequestEmailMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/gym/pickup-requests/:id/resend-email",
    method: "POST",
    middlewares: [validateAndTransformBody(UpdatePickupRequestEmailSchema)],
  },
]
