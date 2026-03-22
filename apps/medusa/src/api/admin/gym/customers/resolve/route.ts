import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createCustomersWorkflow } from "@medusajs/medusa/core-flows";

import { refetchCustomer, sendJson } from "../../helpers";
import type { ResolveGymCustomerSchema } from "./middlewares";

export async function POST(
  req: AuthenticatedMedusaRequest<ResolveGymCustomerSchema>,
  res: MedusaResponse,
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (input: {
      entity: string;
      fields: string[];
      filters: Record<string, unknown>;
    }) => Promise<{ data: Array<Record<string, unknown>> }>;
  };
  const { email, first_name, last_name } = req.validatedBody;

  const { data } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name"],
    filters: { email },
  });

  const existingCustomer = data[0];

  if (existingCustomer?.id) {
    sendJson(res, {
      customer: existingCustomer,
      created: false,
    });
    return;
  }

  const { result } = await createCustomersWorkflow(req.scope).run({
    input: {
      customersData: [
        {
          email,
          first_name,
          last_name,
          has_account: false,
        },
      ],
    },
  });

  const customer = await refetchCustomer(req.scope, result[0].id);

  sendJson(res, {
    customer,
    created: true,
  });
}
