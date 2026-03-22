import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { transferCartCustomerWorkflow, updateCartWorkflow } from "@medusajs/medusa/core-flows";

import { refetchCart, sendJson } from "../../helpers";
import type { AttachGymCartSchema } from "./middlewares";

export async function POST(
  req: AuthenticatedMedusaRequest<AttachGymCartSchema>,
  res: MedusaResponse,
) {
  const { cart_id, customer_id, email } = req.validatedBody;

  await transferCartCustomerWorkflow(req.scope).run({
    input: {
      id: cart_id,
      customer_id,
    },
  });

  if (email) {
    await updateCartWorkflow(req.scope).run({
      input: {
        id: cart_id,
        email,
      },
    });
  }

  const cart = await refetchCart(req.scope, cart_id);
  sendJson(res, { cart });
}
