import { NextResponse } from "next/server";

import { GYM_CART_COOKIE } from "@/lib/cart/cookie";
import { mapPickupRequest } from "@/lib/cart/pickup-request";
import { retrieveCart } from "@/lib/cart/medusa";
import {
  createPickupRequest,
  markPickupRequestEmailResult,
  resolveCartIdFromRequest,
  resolveOrCreateMemberCommerceCustomer,
} from "@/lib/cart/member-bridge";
import { getMarketingData } from "@/lib/data/site";
import { defaultSiteSettings } from "@/lib/data/default-content";
import { hasResendEnv } from "@/lib/env";
import { sendPickupRequestEmails } from "@/lib/email/pickup-request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo registrar la recogida.";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    cartId?: string;
    email?: string;
    notes?: string;
  };
  const cartId = await resolveCartIdFromRequest(body.cartId);

  if (!cartId) {
    return NextResponse.json(
      { error: "No se encontro un carrito activo para solicitar la recogida." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const currentCart = await retrieveCart(cartId);
    const email = user?.email ?? body.email ?? currentCart.email;

    if (!email) {
      return NextResponse.json(
        { error: "Necesitamos un email de contacto antes de solicitar la recogida." },
        { status: 400 },
      );
    }

    const customerBridge = user ? await resolveOrCreateMemberCommerceCustomer(user) : null;
    const response = await createPickupRequest(cartId, {
      email,
      customerId: customerBridge?.medusa_customer_id ?? null,
      supabaseUserId: user?.id ?? null,
      notes: body.notes ?? null,
    });
    let pickupRequest = mapPickupRequest(response.pickup_request);
    let emailWarning: string | null = null;
    const { settings } = await getMarketingData();
    const internalRecipient = settings.contact_email ?? defaultSiteSettings.contact_email;

    try {
      if (!hasResendEnv()) {
        throw new Error("RESEND_API_KEY no esta configurada.");
      }

      await sendPickupRequestEmails({
        pickupRequest,
        siteName: settings.site_name ?? defaultSiteSettings.site_name,
        internalRecipient,
      });

      const emailResponse = await markPickupRequestEmailResult(pickupRequest.id, {
        emailStatus: "sent",
        emailSentAt: new Date().toISOString(),
      });

      pickupRequest = mapPickupRequest(emailResponse.pickup_request);
    } catch (emailError) {
      emailWarning =
        emailError instanceof Error
          ? emailError.message
          : "La solicitud se creo, pero el email no pudo enviarse.";

      try {
        const emailResponse = await markPickupRequestEmailResult(pickupRequest.id, {
          emailStatus: "failed",
          emailError: emailWarning,
        });

        pickupRequest = mapPickupRequest(emailResponse.pickup_request);
      } catch {
        // Si Medusa no puede registrar el estado del email no bloqueamos la solicitud.
      }
    }

    const nextResponse = NextResponse.json({
      pickupRequest,
      emailWarning,
    });

    nextResponse.cookies.set(GYM_CART_COOKIE, "", {
      maxAge: 0,
      path: "/",
      sameSite: "lax",
    });

    return nextResponse;
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
