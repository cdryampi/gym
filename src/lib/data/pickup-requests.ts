import { cache } from "react";

import {
  mapPickupRequest,
  type MedusaPickupRequest,
} from "@/lib/cart/pickup-request";
import type {
  PickupRequestDetail,
  PickupRequestStatus,
} from "@/lib/cart/types";
import {
  listPickupRequests,
  reconcileRecentPickupRequests,
  retrievePickupRequest,
} from "@/lib/cart/member-bridge";
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

function matchesMemberPickupRequest(
  pickupRequest: PickupRequestDetail,
  input: {
    email?: string | null;
    supabaseUserId?: string | null;
  },
) {
  const email = input.email?.trim().toLowerCase() ?? null;
  const supabaseUserId = input.supabaseUserId?.trim() ?? null;

  return (
    (email && pickupRequest.email.trim().toLowerCase() === email) ||
    (supabaseUserId && pickupRequest.supabaseUserId === supabaseUserId)
  );
}

export async function getMemberPickupRequestById(input: {
  id: string;
  email?: string | null;
  supabaseUserId?: string | null;
}): Promise<PickupRequestDetail | null> {
  const pickupRequest = await getPickupRequestById(input.id);

  if (!pickupRequest) {
    return null;
  }

  if (!matchesMemberPickupRequest(pickupRequest, input)) {
    return null;
  }

  return pickupRequest;
}

export async function getLatestPickupRequestByEmail(email: string) {
  const snapshot = await getPickupRequestsSnapshot({
    email,
    limit: 1,
    offset: 0,
  });

  return snapshot.pickupRequests[0] ?? null;
}

function dedupePickupRequests(pickupRequests: PickupRequestDetail[]) {
  const uniquePickupRequests = new Map<string, PickupRequestDetail>();

  pickupRequests.forEach((pickupRequest) => {
    uniquePickupRequests.set(pickupRequest.id, pickupRequest);
  });

  return Array.from(uniquePickupRequests.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export async function reconcileRecentPickupRequestsSnapshot(filters?: {
  hours?: number;
  limit?: number;
  email?: string | null;
}) {
  const readinessWarning = getPickupRequestsReadinessWarning();

  if (readinessWarning) {
    return {
      reconciledCount: 0,
      warning: readinessWarning,
    };
  }

  try {
    const response = await reconcileRecentPickupRequests({
      hours: filters?.hours ?? 24,
      limit: filters?.limit ?? 25,
      email: filters?.email ?? null,
    });

    return {
      reconciledCount: response.reconciled_count ?? 0,
      warning: null,
    };
  } catch (error) {
    return {
      reconciledCount: 0,
      warning:
        error instanceof Error
          ? error.message
          : "No se pudieron reconciliar los pedidos pickup recientes.",
    };
  }
}

export async function getMemberPickupRequestsHistory(input: {
  email?: string | null;
  supabaseUserId?: string | null;
}) {
  const readinessWarning = getPickupRequestsReadinessWarning();

  if (readinessWarning) {
    return {
      pickupRequests: [] as PickupRequestDetail[],
      warning: readinessWarning,
    };
  }

  const email = input.email?.trim().toLowerCase() ?? null;
  const supabaseUserId = input.supabaseUserId?.trim() ?? null;

  if (!email && !supabaseUserId) {
    return {
      pickupRequests: [] as PickupRequestDetail[],
      warning: null,
    };
  }

  try {
    if (email) {
      await reconcileRecentPickupRequestsSnapshot({
        email,
        hours: 24,
        limit: 10,
      });
    }

    const [byUserId, byEmail] = await Promise.all([
      supabaseUserId
        ? listPickupRequests({
            supabaseUserId,
            limit: 25,
            offset: 0,
          }).then((response) => ({
            warning: null,
            pickupRequests: (response.pickup_requests ?? []).map((pickupRequest) =>
              mapPickupRequest(pickupRequest as MedusaPickupRequest),
            ),
          }))
        : Promise.resolve({ warning: null, pickupRequests: [] as PickupRequestDetail[] }),
      email
        ? getPickupRequestsSnapshot({
            email,
            limit: 25,
            offset: 0,
            status: null,
          })
        : Promise.resolve({
            pickupRequests: [] as PickupRequestDetail[],
            count: 0,
            warning: null,
          }),
    ]);

    return {
      pickupRequests: dedupePickupRequests([
        ...byUserId.pickupRequests,
        ...byEmail.pickupRequests,
      ]),
      warning: byUserId.warning ?? byEmail.warning ?? null,
    };
  } catch (error) {
    return {
      pickupRequests: [] as PickupRequestDetail[],
      warning:
        error instanceof Error
          ? error.message
          : "No se pudo cargar el historial pickup del socio.",
    };
  }
}
