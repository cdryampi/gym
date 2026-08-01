import { NextResponse } from "next/server";

import { GYM_CART_COOKIE } from "@/lib/cart/cookie";
import {
  createPickupRequest,
  listPickupRequests,
  resolveCartIdFromRequest,
  resolveOrCreateMemberCommerceCustomer,
} from "@/lib/cart/member-bridge";
import { mapPickupRequest } from "@/lib/cart/pickup-request";
import { isMissingCartMessage, STALE_CART_MESSAGE } from "@/lib/cart/runtime";
import { getCurrentMemberUser } from "@/lib/auth";
import { defaultSiteSettings } from "@/lib/data/default-content";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { validateRequestOrigin, withApiErrorHandling } from "@/lib/api-utils";

function clearCartCookie(response: NextResponse) {
  response.cookies.set(GYM_CART_COOKIE, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo registrar la solicitud de recogida.";
}

async function resolveWhatsAppBaseUrl() {
  try {
    const supabase = createSupabasePublicClient();
    const { data } = await supabase
      .from("site_settings")
      .select("whatsapp_url")
      .limit(1)
      .maybeSingle();

    const configuredUrl = data?.whatsapp_url?.trim();
    return configuredUrl || defaultSiteSettings.whatsapp_url;
  } catch {
    return defaultSiteSettings.whatsapp_url;
  }
}

function buildWhatsAppUrl(baseUrl: string | null | undefined, identifier: string | null | undefined) {
  const safeBaseUrl = baseUrl?.trim();
  const safeIdentifier = identifier?.trim();

  if (!safeBaseUrl || !safeIdentifier) {
    return null;
  }

  try {
    const url = new URL(safeBaseUrl);
    url.searchParams.set(
      "text",
      `Hola, acabo de hacer un pedido en la tienda. Mi referencia es ${safeIdentifier}.`,
    );
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    const originCheck = validateRequestOrigin(request);
    if (!originCheck.success) return originCheck.errorResponse;

    const body = (await request.json().catch(() => ({}))) as {
      cartId?: string;
      email?: string;
      notes?: string;
    };
    const cartId = await resolveCartIdFromRequest(body.cartId);

    if (!cartId) {
      return NextResponse.json(
        { error: "No se encontro un carrito activo para enviar la reserva." },
        { status: 400 },
      );
    }

    const requestedEmail = body.email?.trim().toLowerCase() ?? "";
    const notes = body.notes?.trim() || undefined;

    const user = await getCurrentMemberUser();

    try {
      let pickupRequest = null;

      const existingPickupRequests = await listPickupRequests({
        cartId,
        limit: 1,
        offset: 0,
      });

      if (existingPickupRequests.pickup_requests[0]) {
        pickupRequest = mapPickupRequest(existingPickupRequests.pickup_requests[0]);
      } else {
        const email = user?.email?.trim().toLowerCase() || requestedEmail;

        if (!email) {
          return NextResponse.json(
            { error: "Necesitamos un email de contacto para registrar tu reserva." },
            { status: 400 },
          );
        }

        let customerId: string | null = null;
        let supabaseUserId: string | null = null;

        if (user) {
          const customerBridge = await resolveOrCreateMemberCommerceCustomer(user);
          customerId = customerBridge.medusa_customer_id;
          supabaseUserId = user.id;
        }

        const response = await createPickupRequest(cartId, {
          email,
          customerId,
          supabaseUserId,
          notes,
        });

        pickupRequest = mapPickupRequest(response.pickup_request);
      }

      const whatsappBaseUrl = await resolveWhatsAppBaseUrl();
      const whatsappUrl = buildWhatsAppUrl(
        whatsappBaseUrl,
        pickupRequest.orderId ?? pickupRequest.cartId,
      );

      return clearCartCookie(
        NextResponse.json({
          pickupRequest,
          whatsappUrl,
        }),
      );
    } catch (error) {
      const message = getErrorMessage(error);

      if (isMissingCartMessage(message)) {
        return clearCartCookie(
          NextResponse.json(
            {
              error: STALE_CART_MESSAGE,
            },
            { status: 409 },
          ),
        );
      }

      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
