import type { MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";

export async function refetchCart(scope: { resolve: (key: string) => unknown }, id: string) {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (input: {
      entity: string;
      fields: string[];
      filters: Record<string, unknown>;
    }) => Promise<{ data: Array<Record<string, unknown>> }>;
  };

  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "email",
      "customer_id",
      "region_id",
      "currency_code",
      "subtotal",
      "total",
      "tax_total",
      "shipping_total",
      "discount_total",
      "completed_at",
      "metadata",
      "items.*",
      "items.unit_price",
      "items.subtotal",
      "items.total",
    ],
    filters: { id },
  });

  const cart = data[0];

  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Cart with id '${id}' not found.`,
    );
  }

  return cart;
}

export async function refetchCustomer(scope: { resolve: (key: string) => unknown }, id: string) {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (input: {
      entity: string;
      fields: string[];
      filters: Record<string, unknown>;
    }) => Promise<{ data: Array<Record<string, unknown>> }>;
  };

  const { data } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name"],
    filters: { id },
  });

  const customer = data[0];

  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer with id '${id}' not found.`,
    );
  }

  return customer;
}

export function sendJson(res: MedusaResponse, payload: Record<string, unknown>) {
  res.status(200).json(payload);
}
