import { cache } from "react";

import {
  mapPickupRequest,
  type MedusaPickupRequest,
} from "@/lib/cart/pickup-request";
import type {
  PickupRequestDetail,
  PickupRequestStatus,
} from "@/lib/cart/types";
import { listPickupRequests, retrievePickupRequest } from "@/lib/cart/member-bridge";
import { hasMedusaAdminEnv } from "@/lib/env";

export interface PickupRequestsSnapshot {
  pickupRequests: PickupRequestDetail[];
  count: number;
  warning: string | null;
}

function getPickupRequestsReadinessWarning() {
  if (!hasMedusaAdminEnv()) {
    return (
      "El dashboard de pedidos pickup requiere MEDUSA_ADMIN_API_KEY y MEDUSA_BACKEND_URL " +
      "(o NEXT_PUBLIC_MEDUSA_BACKEND_URL). Configuralos para operar solicitudes reales."
    );
  }

  return null;
}

export const getPickupRequestsSnapshot = cache(
  async (filters?: {
    status?: PickupRequestStatus | null;
    email?: string | null;
    limit?: number;
    offset?: number;
  }): Promise<PickupRequestsSnapshot> => {
    const readinessWarning = getPickupRequestsReadinessWarning();

    if (readinessWarning) {
      return {
        pickupRequests: [],
        count: 0,
        warning: readinessWarning,
      };
    }

    try {
      const response = await listPickupRequests({
        status: filters?.status ?? null,
        email: filters?.email ?? null,
        limit: filters?.limit ?? 50,
        offset: filters?.offset ?? 0,
      });

      return {
        pickupRequests: (response.pickup_requests ?? []).map((pickupRequest) =>
          mapPickupRequest(pickupRequest as MedusaPickupRequest),
        ),
        count: response.count ?? 0,
        warning: null,
      };
    } catch (error) {
      return {
        pickupRequests: [],
        count: 0,
        warning:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los pedidos pickup.",
      };
    }
  },
);

export async function getPickupRequestById(id: string): Promise<PickupRequestDetail | null> {
  const readinessWarning = getPickupRequestsReadinessWarning();

  if (readinessWarning) {
    return null;
  }

  try {
    const response = await retrievePickupRequest(id);
    return mapPickupRequest(response.pickup_request as MedusaPickupRequest);
  } catch {
    return null;
  }
}

export async function getLatestPickupRequestByEmail(email: string) {
  const snapshot = await getPickupRequestsSnapshot({
    email,
    limit: 1,
    offset: 0,
  });

  return snapshot.pickupRequests[0] ?? null;
}
