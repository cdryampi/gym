import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework/http"
import { z } from "zod"

export const ReconcileRecentPickupRequestsSchema = z.object({
  hours: z.number().int().min(1).max(168).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  email: z.string().trim().email().optional(),
})

export type ReconcileRecentPickupRequestsSchema = z.infer<
  typeof ReconcileRecentPickupRequestsSchema
>

export const pickupRequestReconcileRecentMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/gym/pickup-requests/reconcile-recent",
    method: "POST",
    middlewares: [validateAndTransformBody(ReconcileRecentPickupRequestsSchema)],
  },
]
