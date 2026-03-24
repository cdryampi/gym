import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework/http"
import { z } from "zod"

export const SyncPickupRequestFromOrderSchema = z.object({
  order_id: z.string().min(1),
  cart_id: z.string().min(1),
  supabase_user_id: z.string().min(1).optional(),
  notes: z.string().trim().max(2000).optional(),
})

export type SyncPickupRequestFromOrderSchema = z.infer<
  typeof SyncPickupRequestFromOrderSchema
>

export const pickupRequestSyncOrderMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/gym/pickup-requests/sync-order",
    method: "POST",
    middlewares: [validateAndTransformBody(SyncPickupRequestFromOrderSchema)],
  },
]
