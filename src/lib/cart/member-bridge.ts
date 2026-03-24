import type { User } from "@supabase/supabase-js";

import { getMedusaAdminSdk } from "@/lib/medusa/admin-sdk";
import type { MedusaCart } from "@/lib/cart/medusa";
import type { MedusaPickupRequest } from "@/lib/cart/pickup-request";
import {
  getMemberCommerceCustomerByUserId,
  upsertMemberCommerceCustomer,
} from "@/lib/supabase/member-commerce";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

import { getCartIdFromRequestCookies } from "./server";

function toBridgeError(error: unknown, fallback: string) {
  console.error("[Medusa Bridge Error]:", error);
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return fallback;
}

async function requestMedusaAdmin<TResponse>(path: string, body: Record<string, unknown>) {
  const sdk = getMedusaAdminSdk();

  return sdk.client.fetch<TResponse>(path, {
    method: "POST",
    body,
  });
}

interface MedusaAdminCartResponse {
  cart: MedusaCart;
}

interface MedusaAdminPickupRequestResponse {
  pickup_request: MedusaPickupRequest;
}

interface MedusaAdminPickupRequestsListResponse {
  pickup_requests: MedusaPickupRequest[];
  count: number;
  limit: number;
  offset: number;
}

interface MedusaAdminOrderLookupResponse {
  order: {
    id?: string | null;
    display_id?: number | null;
    cart_id?: string | null;
    created_at?: string | null;
  } | null;
}

export async function resolveOrCreateMemberCommerceCustomer(user: User) {
  if (!user.email) {
    throw new Error("La cuenta del miembro no tiene email y no se puede sincronizar con Medusa.");
  }

  const supabase = createSupabaseAdminClient();
  const existingBridge = await getMemberCommerceCustomerByUserId(supabase, user.id);

  if (existingBridge?.medusa_customer_id) {
    if (existingBridge.email !== user.email) {
      return upsertMemberCommerceCustomer(supabase, {
        supabase_user_id: user.id,
        email: user.email,
        medusa_customer_id: existingBridge.medusa_customer_id,
      });
    }

    return existingBridge;
  }

  const response = await requestMedusaAdmin<{
    customer: {
      id: string;
    };
  }>("/admin/gym/customers/resolve", {
    email: user.email,
  });

  return upsertMemberCommerceCustomer(supabase, {
    supabase_user_id: user.id,
    email: user.email,
    medusa_customer_id: response.customer.id,
  });
}

export async function attachCartToMember(cartId: string, customerId: string, email: string) {
  try {
    return await requestMedusaAdmin<MedusaAdminCartResponse>("/admin/gym/carts/attach", {
      cart_id: cartId,
      customer_id: customerId,
      email,
    });
  } catch (error) {
    throw new Error(
      `No se pudo vincular el carrito a la cuenta del miembro: ${toBridgeError(error, "fallo desconocido")}`,
    );
  }
}

export async function createPickupRequest(
  cartId: string,
  payload: {
    email: string;
    customerId?: string | null;
    supabaseUserId?: string | null;
    notes?: string | null;
  },
) {
  try {
    return await requestMedusaAdmin<MedusaAdminPickupRequestResponse>(
      "/admin/gym/pickup-requests",
      {
        cart_id: cartId,
        email: payload.email,
        customer_id: payload.customerId ?? undefined,
        supabase_user_id: payload.supabaseUserId ?? undefined,
        notes: payload.notes ?? undefined,
      },
    );
  } catch (error) {
    throw new Error(
      `No se pudo registrar la solicitud de recogida: ${toBridgeError(error, "fallo desconocido")}`,
    );
  }
}

export async function syncPickupRequestFromOrder(
  cartId: string,
  payload: {
    orderId: string;
    supabaseUserId?: string | null;
    notes?: string | null;
  },
) {
  try {
    return await requestMedusaAdmin<MedusaAdminPickupRequestResponse>(
      "/admin/gym/pickup-requests/sync-order",
      {
        cart_id: cartId,
        order_id: payload.orderId,
        supabase_user_id: payload.supabaseUserId ?? undefined,
        notes: payload.notes ?? undefined,
      },
    );
  } catch (error) {
    throw new Error(
      `No se pudo proyectar el pedido pagado a pickup_request: ${toBridgeError(error, "fallo desconocido")}`,
    );
  }
}

export async function listPickupRequests(filters?: {
  limit?: number;
  offset?: number;
  status?: string | null;
  email?: string | null;
  cartId?: string | null;
  customerId?: string | null;
  supabaseUserId?: string | null;
}) {
  const query = new URLSearchParams();

  if (typeof filters?.limit === "number") {
    query.set("limit", String(filters.limit));
  }

  if (typeof filters?.offset === "number") {
    query.set("offset", String(filters.offset));
  }

  if (filters?.status) {
    query.set("status", filters.status);
  }

  if (filters?.email) {
    query.set("email", filters.email);
  }

  if (filters?.cartId) {
    query.set("cart_id", filters.cartId);
  }

  if (filters?.customerId) {
    query.set("customer_id", filters.customerId);
  }

  if (filters?.supabaseUserId) {
    query.set("supabase_user_id", filters.supabaseUserId);
  }

  const suffix = query.toString();
  const path = suffix ? `/admin/gym/pickup-requests?${suffix}` : "/admin/gym/pickup-requests";

  try {
    return await getMedusaAdminSdk().client.fetch<MedusaAdminPickupRequestsListResponse>(path, {
      method: "GET",
    });
  } catch (error) {
    throw new Error(
      `No se pudieron cargar las solicitudes pickup: ${toBridgeError(error, "fallo desconocido")}`,
    );
  }
}

export async function retrievePickupRequest(pickupRequestId: string) {
  try {
    return await getMedusaAdminSdk().client.fetch<MedusaAdminPickupRequestResponse>(
      `/admin/gym/pickup-requests/${pickupRequestId}`,
      {
        method: "GET",
      },
    );
  } catch (error) {
    throw new Error(
      `No se pudo cargar la solicitud pickup: ${toBridgeError(error, "fallo desconocido")}`,
    );
  }
}

export async function retrieveOrderByCartId(cartId: string) {
  const query = new URLSearchParams({
    cart_id: cartId,
  });

  try {
    const response = await getMedusaAdminSdk().client.fetch<MedusaAdminOrderLookupResponse>(
      `/admin/gym/orders/by-cart?${query.toString()}`,
      {
        method: "GET",
      },
    );

    return response.order;
  } catch (error) {
    throw new Error(
      `No se pudo consultar la orden del carrito: ${toBridgeError(error, "fallo desconocido")}`,
    );
  }
}

export async function updatePickupRequestStatus(
  pickupRequestId: string,
  status: string,
) {
  try {
    return await requestMedusaAdmin<MedusaAdminPickupRequestResponse>(
      `/admin/gym/pickup-requests/${pickupRequestId}/status`,
      {
        status,
      },
    );
  } catch (error) {
    throw new Error(
      `No se pudo actualizar el estado del pedido pickup: ${toBridgeError(error, "fallo desconocido")}`,
    );
  }
}

export async function markPickupRequestEmailResult(
  pickupRequestId: string,
  payload: {
    emailStatus: "pending" | "sent" | "failed";
    emailError?: string | null;
    emailSentAt?: string | null;
  },
) {
  try {
    return await requestMedusaAdmin<MedusaAdminPickupRequestResponse>(
      `/admin/gym/pickup-requests/${pickupRequestId}/resend-email`,
      {
        email_status: payload.emailStatus,
        email_error: payload.emailError ?? undefined,
        email_sent_at: payload.emailSentAt ?? undefined,
      },
    );
  } catch (error) {
    throw new Error(
      `No se pudo registrar el estado del email pickup: ${toBridgeError(error, "fallo desconocido")}`,
    );
  }
}

export async function resolveCartIdFromRequest(explicitCartId?: string | null) {
  return explicitCartId ?? (await getCartIdFromRequestCookies());
}
