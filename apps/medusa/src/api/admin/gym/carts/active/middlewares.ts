import type { MiddlewareRoute } from "@medusajs/framework/http";
import { validateAndTransformQuery } from "@medusajs/framework/http";
import { z } from "zod";

export const GetActiveGymCartSchema = z.object({
  customer_id: z.string().trim().min(1),
});

export type GetActiveGymCartSchema = z.infer<typeof GetActiveGymCartSchema>;

export const activeGymCartMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/gym/carts/active",
    method: "GET",
    middlewares: [validateAndTransformQuery(GetActiveGymCartSchema, {})],
  },
];
