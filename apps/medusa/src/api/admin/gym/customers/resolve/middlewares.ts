import type { MiddlewareRoute } from "@medusajs/framework/http";
import { validateAndTransformBody } from "@medusajs/framework/http";
import { z } from "zod";

export const ResolveGymCustomerSchema = z.object({
  email: z.string().trim().email(),
  first_name: z.string().trim().min(1).optional(),
  last_name: z.string().trim().min(1).optional(),
});

export type ResolveGymCustomerSchema = z.infer<typeof ResolveGymCustomerSchema>;

export const resolveGymCustomerMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/gym/customers/resolve",
    method: "POST",
    middlewares: [validateAndTransformBody(ResolveGymCustomerSchema)],
  },
];
