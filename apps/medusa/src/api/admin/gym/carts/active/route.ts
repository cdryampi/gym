import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { refetchCart, sendJson } from "../../helpers";
import type { GetActiveGymCartSchema } from "./middlewares";

type CartListRecord = {
  id?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
  items?: Array<{ id?: string | null }> | null;
};

function sortActiveCarts(left: CartListRecord, right: CartListRecord) {
  const leftHasItems = Array.isArray(left.items) && left.items.length > 0;
  const rightHasItems = Array.isArray(right.items) && right.items.length > 0;

  if (leftHasItems !== rightHasItems) {
    return leftHasItems ? -1 : 1;
  }

  const leftUpdatedAt = typeof left.updated_at === "string" ? left.updated_at : "";
  const rightUpdatedAt = typeof right.updated_at === "string" ? right.updated_at : "";

  return rightUpdatedAt.localeCompare(leftUpdatedAt);
}

export const AUTHENTICATE = false;

export async function GET(
  req: AuthenticatedMedusaRequest<GetActiveGymCartSchema>,
  res: MedusaResponse,
) {
  const query = req.scope.resolve("query") as {
    graph: (input: {
      entity: string;
      fields: string[];
      filters: Record<string, unknown>;
    }) => Promise<{ data: CartListRecord[] }>;
  };

  const { customer_id } = req.validatedQuery;
  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "updated_at", "completed_at", "items.id"],
    filters: {
      customer_id,
    },
  });

  const activeCart = data
    .filter((cart) => !cart.completed_at && typeof cart.id === "string" && cart.id.trim())
    .sort(sortActiveCarts)[0];

  if (!activeCart?.id) {
    sendJson(res, { cart: null });
    return;
  }

  const cart = await refetchCart(req.scope, activeCart.id);
  sendJson(res, { cart });
}
