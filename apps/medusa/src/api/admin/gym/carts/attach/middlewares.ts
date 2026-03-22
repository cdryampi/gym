import type { MiddlewareRoute } from "@medusajs/framework/http";
import { validateAndTransformBody } from "@medusajs/framework/http";
import { z } from "zod";

export const AttachGymCartSchema = z.object({
  cart_id: z.string().trim().min(1),
  customer_id: z.string().trim().min(1),
  email: z.string().trim().email().optional(),
});

export type AttachGymCartSchema = z.infer<typeof AttachGymCartSchema>;

export const attachGymCartMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/gym/carts/attach",
    method: "POST",
    middlewares: [validateAndTransformBody(AttachGymCartSchema)],
  },
];
