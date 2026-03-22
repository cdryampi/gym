import type { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformBody } from "@medusajs/framework/http"
import { z } from "zod"

export const CreatePickupRequestSchema = z.object({
  cart_id: z.string().trim().min(1),
  email: z.string().trim().email(),
  customer_id: z.string().trim().min(1).optional(),
  supabase_user_id: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(500).optional(),
})

export type CreatePickupRequestSchema = z.infer<typeof CreatePickupRequestSchema>

export const pickupRequestMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/gym/pickup-requests",
    method: "POST",
    middlewares: [validateAndTransformBody(CreatePickupRequestSchema)],
  },
]
