import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework/http"
import { z } from "zod"

export const SyncPickupRequestFromOrderSchema = z.object({
  cart_id: z.string().min(1),
  order_id: z.string().min(1).optional(),
  paypal_order_id: z.string().min(1).optional(),
  supabase_user_id: z.string().min(1).optional(),
  notes: z.string().trim().max(2000).optional(),
}).refine((value) => value.order_id || value.paypal_order_id || value.cart_id, {
  message: "Necesitamos cart_id, order_id o paypal_order_id para sincronizar el pedido.",
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
