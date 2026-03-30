import type { User } from "@supabase/supabase-js";

import { mapPickupRequest } from "@/lib/cart/pickup-request";
import type { Cart, PickupRequestDetail } from "@/lib/cart/types";
import { defaultSiteSettings } from "@/lib/data/default-content";
import { getMarketingData } from "@/lib/data/site";
import { getSmtpEnv } from "@/lib/env";
import { resolveTransactionalSender } from "@/lib/email/policy";
import { sendPickupRequestEmails } from "@/lib/email/pickup-request";
import { ensurePayPalProviderEnabledForRegion } from "@/lib/medusa/paypal-admin";
import { isPayPalPaymentProviderId } from "@/lib/medusa/paypal-provider";
import { createCheckoutTrace } from "@/lib/paypal/checkout-trace";
import { resolvePayPalChargeQuote } from "@/lib/paypal/quote";

import {
  attachCartToMember,
  listPickupRequests,
  markPickupRequestEmailResult,
  resolveOrCreateMemberCommerceCustomer,
  retrieveOrderByCartId,
  retrievePickupRequest,
  syncPickupRequestFromOrder,
} from "./member-bridge";
import {
  addFirstAvailableShippingMethod,
  completeCart,
  initiatePayPalPaymentSession,
  retrieveCart,
  updateCartEmail,
  updateCartMetadata,
} from "./medusa";
import { STALE_COMPLETED_CART_MESSAGE } from "./runtime";

type CheckoutTrace = ReturnType<typeof createCheckoutTrace>;

type CheckoutUser = Pick<User, "id" | "email"> | null | undefined;

type CheckoutActorInput = {
  cartId: string;
  email?: string | null;
  notes?: string | null;
  user?: CheckoutUser;
  trace?: CheckoutTrace;
};

type CheckoutRecoveryInput = {
  cartId: string;
  pickupRequestId?: string | null;
  checkoutMessage?: string | null;
  user?: CheckoutUser;
  notes?: string | null;
  trace?: CheckoutTrace;
};

export type PreparePayPalCheckoutResult = {
  cart: Cart;
};

export type CompletePayPalCheckoutResult =
  | {
      kind: "success";
      pickupRequest: PickupRequestDetail;
      emailWarning: string | null;
    }
  | {
      kind: "stale-cart";
      message: string;
    }
  | {
      kind: "processing";
      message: string;
    };

export type PayPalCheckoutStatusResult =
  | {
      status: "ready";
      pickupRequest: PickupRequestDetail;
      emailWarning: string | null;
    }
  | {
      status: "processing";
      message: string;
    }
  | {
      status: "pending_manual_review";
      message: string;
    };

export const CHECKOUT_PROCESSING_MESSAGE =
  "PayPal ya ha confirmado tu pago. Estamos terminando de registrar tu pedido en Nova Forza. No vuelvas a pagar; en unos segundos aparecera en Mi cuenta.";
export const CHECKOUT_MANUAL_REVIEW_MESSAGE =
  "Hemos recibido tu pago y lo estamos revisando manualmente. No vuelvas a pagar. Si en un minuto no ves el pedido en Mi cuenta, contacta con el club.";
export const CHECKOUT_STATUS_ERROR_MESSAGE =
  "No hemos podido confirmar el estado final del pedido desde la web. No vuelvas a pagar por ahora. Primero revisa Mi cuenta y, si no aparece, contacta con el club con tu referencia temporal.";
export const PAYPAL_CHECKOUT_STATUS_PENDING_ATTEMPTS = 6;

function buildCheckoutIdempotencyKey(cartId: string, orderId: string) {
  return `paypal-complete:${cartId}:${orderId}`;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isCheckoutInProgressMessage(message: string | null | undefined) {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();

  return (
    normalized.includes("checkout ya en progreso") ||
    normalized.includes("conflicted with another request") ||
    normalized.includes("already being completed by another request") ||
    normalized.includes("failed to acquire lock")
  );
}

function getCheckoutErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo completar el checkout con PayPal.";
}

async function resolveCheckoutEmail(cart: Cart, user?: CheckoutUser, email?: string | null) {
  return user?.email ?? email?.trim().toLowerCase() ?? cart.email;
}

async function syncCartMember(
  cart: Cart,
  cartId: string,
  user: CheckoutUser,
  trace?: CheckoutTrace,
) {
  if (!user?.email) {
    return cart;
  }

  const customerBridge = trace
    ? await trace.step(
        "resolve_member_customer",
        () => resolveOrCreateMemberCommerceCustomer(user as User),
        (bridge) => ({
          medusaCustomerId: bridge.medusa_customer_id,
        }),
      )
    : await resolveOrCreateMemberCommerceCustomer(user as User);

  if (cart.customerId === customerBridge.medusa_customer_id) {
    return cart;
  }

  try {
    if (trace) {
      await trace.step("attach_customer", () =>
        attachCartToMember(cartId, customerBridge.medusa_customer_id, user.email!),
      );
    } else {
      await attachCartToMember(cartId, customerBridge.medusa_customer_id, user.email!);
    }
  } catch {
    const recoveredCart = trace
      ? await trace.step(
          "recover_cart_after_attach_failure",
          () => retrieveCart(cartId),
          (currentCart) => ({
            itemCount: currentCart.summary.itemCount,
            customerId: currentCart.customerId,
          }),
        )
      : await retrieveCart(cartId);

    return recoveredCart;
  }

  return {
    ...cart,
    customerId: customerBridge.medusa_customer_id,
  };
}

async function finalizePickupRequestEmail(
  pickupRequestInput: PickupRequestDetail,
  trace?: CheckoutTrace,
): Promise<{
  pickupRequest: PickupRequestDetail;
  emailWarning: string | null;
}> {
  let emailWarning: string | null = null;
  let pickupRequest = pickupRequestInput;
  trace?.setContext({
    orderId: pickupRequest.orderId,
    pickupRequestId: pickupRequest.id,
  });

  const { settings } = await getMarketingData();
  const internalRecipient =
    settings.notification_email ?? defaultSiteSettings.notification_email;
  const smtp = getSmtpEnv();
  const sender = resolveTransactionalSender(
    settings.site_name ?? defaultSiteSettings.site_name,
    settings.transactional_from_email ?? defaultSiteSettings.transactional_from_email,
    smtp.fromEmail,
    [smtp.user],
  );

  if (pickupRequest.emailStatus === "pending") {
    try {
      if (trace) {
        await trace.step("email_send", () =>
          sendPickupRequestEmails({
            pickupRequest,
            siteName: settings.site_name ?? defaultSiteSettings.site_name,
            internalRecipient,
            fromEmail: sender.fromEmail,
            replyTo: sender.replyTo,
          }),
        );
      } else {
        await sendPickupRequestEmails({
          pickupRequest,
          siteName: settings.site_name ?? defaultSiteSettings.site_name,
          internalRecipient,
          fromEmail: sender.fromEmail,
          replyTo: sender.replyTo,
        });
      }

      const emailResponse = await markPickupRequestEmailResult(pickupRequest.id, {
        emailStatus: "sent",
        emailSentAt: new Date().toISOString(),
      });

      pickupRequest = mapPickupRequest(emailResponse.pickup_request);
    } catch (emailError) {
      emailWarning =
        emailError instanceof Error
          ? emailError.message
          : "El pedido se completó, pero el email no pudo enviarse.";

      try {
        const emailResponse = await markPickupRequestEmailResult(pickupRequest.id, {
          emailStatus: "failed",
          emailError: emailWarning,
        });

        pickupRequest = mapPickupRequest(emailResponse.pickup_request);
      } catch {
        // Si no se puede registrar el estado del email, no bloqueamos el pedido ya pagado.
      }
    }
  } else if (pickupRequest.emailStatus === "failed") {
    emailWarning =
      pickupRequest.emailError ?? "El pedido se completó, pero el email no pudo enviarse.";
  }

  return {
    pickupRequest,
    emailWarning,
  };
}

async function resolveRecoveredPickupRequest({
  cartId,
  pickupRequestId,
  checkoutMessage,
  user,
  notes,
  trace,
}: CheckoutRecoveryInput) {
  const recoveredPickupRequest = await recoverCompletedPickupCheckout(
    cartId,
    pickupRequestId,
    checkoutMessage,
    {
      supabaseUserId: user?.id ?? null,
      notes: notes?.trim() || null,
    },
    trace,
  );

  if (!recoveredPickupRequest) {
    return null;
  }

  return finalizePickupRequestEmail(recoveredPickupRequest, trace);
}

export async function recoverCompletedPickupCheckout(
  cartId: string,
  pickupRequestId?: string | null,
  checkoutMessage?: string | null,
  input?: {
    supabaseUserId?: string | null;
    notes?: string | null;
  },
  trace?: CheckoutTrace,
) {
  const retryDelaysMs = isCheckoutInProgressMessage(checkoutMessage)
    ? [0]
    : [0, 800, 1800, 3200];
  let nextPickupRequestId = pickupRequestId ?? null;
  let recoveredMedusaOrderId: string | null = null;
  let recoveredPayPalOrderId: string | null = null;

  const recover = async () => {
    for (const waitMs of retryDelaysMs) {
      if (waitMs > 0) {
        await delay(waitMs);
      }

      if (nextPickupRequestId) {
        try {
          const existing = await retrievePickupRequest(nextPickupRequestId);
          return mapPickupRequest(existing.pickup_request);
        } catch {
          // Seguimos con la búsqueda por cart_id por si el metadata aún no está actualizado.
        }
      }

      try {
        const currentCart = await retrieveCart(cartId);
        nextPickupRequestId = currentCart.summary.pickupRequestId;
        recoveredPayPalOrderId ||= currentCart.paymentSession?.paypalOrderId ?? null;

        if (nextPickupRequestId) {
          const existing = await retrievePickupRequest(nextPickupRequestId);
          return mapPickupRequest(existing.pickup_request);
        }
      } catch {
        // El carrito puede dejar de estar disponible justo después del checkout.
      }

      try {
        const response = await listPickupRequests({
          cartId,
          limit: 1,
        });
        const existingPickupRequest = response.pickup_requests[0];

        if (existingPickupRequest) {
          return mapPickupRequest(existingPickupRequest);
        }
      } catch {
        // No bloqueamos la recuperación por un fallo transitorio del bridge.
      }

      if (recoveredPayPalOrderId) {
        try {
          const syncResponse = await syncPickupRequestFromOrder(cartId, {
            orderId: recoveredMedusaOrderId,
            paypalOrderId: recoveredPayPalOrderId,
            supabaseUserId: input?.supabaseUserId ?? null,
            notes: input?.notes ?? null,
          });

          return mapPickupRequest(syncResponse.pickup_request);
        } catch {
          // Seguimos con la resolución por order_cart si el pedido todavía no está visible.
        }
      }

      if (!recoveredMedusaOrderId) {
        try {
          const order = await retrieveOrderByCartId(cartId);
          recoveredMedusaOrderId = order?.id ?? null;
        } catch {
          // Si la orden aún no está visible, seguimos esperando.
        }
      }

      if (recoveredMedusaOrderId || recoveredPayPalOrderId) {
        try {
          const syncResponse = await syncPickupRequestFromOrder(cartId, {
            orderId: recoveredMedusaOrderId,
            paypalOrderId: recoveredPayPalOrderId,
            supabaseUserId: input?.supabaseUserId ?? null,
            notes: input?.notes ?? null,
          });

          return mapPickupRequest(syncResponse.pickup_request);
        } catch {
          // La orden puede existir antes de que la proyección pickup quede lista.
        }
      }
    }

    return null;
  };

  return trace
    ? trace.step(
        "recovery_polling",
        recover,
        (pickupRequest) => ({
          recovered: Boolean(pickupRequest),
          orderId: recoveredMedusaOrderId ?? recoveredPayPalOrderId,
          pickupRequestId: pickupRequest?.id ?? nextPickupRequestId,
        }),
      )
    : recover();
}

export async function resolvePayPalCheckoutStatus({
  cartId,
  user,
  trace,
  notes,
  attempt = 0,
}: CheckoutActorInput & { attempt?: number }): Promise<PayPalCheckoutStatusResult> {
  const finalized = await resolveRecoveredPickupRequest({
    cartId,
    checkoutMessage: "Checkout ya en progreso.",
    user,
    notes,
    trace,
  });

  if (finalized) {
    return {
      status: "ready",
      ...finalized,
    };
  }

  if (attempt >= PAYPAL_CHECKOUT_STATUS_PENDING_ATTEMPTS) {
    return {
      status: "pending_manual_review",
      message: CHECKOUT_MANUAL_REVIEW_MESSAGE,
    };
  }

  return {
    status: "processing",
    message: CHECKOUT_PROCESSING_MESSAGE,
  };
}

export async function preparePayPalCheckout({
  cartId,
  email,
  notes,
  user,
  trace,
}: CheckoutActorInput): Promise<PreparePayPalCheckoutResult> {
  let cart = trace
    ? await trace.step(
        "retrieve_cart",
        () => retrieveCart(cartId),
        (currentCart) => ({
          itemCount: currentCart.summary.itemCount,
          requiresShipping: currentCart.summary.requiresShipping,
        }),
      )
    : await retrieveCart(cartId);

  const resolvedEmail = await resolveCheckoutEmail(cart, user, email);

  if (!resolvedEmail) {
    throw new Error("Necesitamos un email de contacto antes de preparar el pago.");
  }

  if (cart.email !== resolvedEmail) {
    cart = trace
      ? await trace.step("update_cart_email", () => updateCartEmail(cartId, resolvedEmail))
      : await updateCartEmail(cartId, resolvedEmail);
  }

  cart = await syncCartMember(cart, cartId, user, trace);

  const regionId = cart.regionId;

  if (!regionId) {
    throw new Error("El carrito no tiene región asociada para preparar PayPal.");
  }

  if (cart.summary.requiresShipping) {
    cart = trace
      ? await trace.step(
          "shipping_auto",
          () => addFirstAvailableShippingMethod(cartId),
          (nextCart) => ({
            shippingTotal: nextCart.summary.shippingTotal,
          }),
        )
      : await addFirstAvailableShippingMethod(cartId);
  }

  const paypalProviderId = trace
    ? await trace.step(
        "ensure_paypal_provider",
        () => ensurePayPalProviderEnabledForRegion(regionId),
        (providerId) => ({
          providerId,
        }),
      )
    : await ensurePayPalProviderEnabledForRegion(regionId);

  const quote = trace
    ? await trace.step(
        "resolve_quote",
        () => resolvePayPalChargeQuote(cart),
        (currentQuote) => ({
          displayAmount: currentQuote.displayAmount,
          chargeAmount: currentQuote.chargeAmount,
        }),
      )
    : await resolvePayPalChargeQuote(cart);

  cart = trace
    ? await trace.step("update_cart_metadata", () =>
        updateCartMetadata(cartId, {
          ...(cart.metadata ?? {}),
          pickup_checkout_notes: notes?.trim() || null,
          pickup_checkout_payment_provider: "paypal",
          pickup_checkout_ready_at: new Date().toISOString(),
          pickup_checkout_display_currency_code: quote.displayCurrencyCode,
          pickup_checkout_display_total: quote.displayAmount,
          pickup_checkout_charge_currency_code: quote.chargeCurrencyCode,
          pickup_checkout_charge_total: quote.chargeAmount,
          pickup_checkout_exchange_rate: null,
          pickup_checkout_exchange_rate_source: null,
          pickup_checkout_exchange_rate_reference: null,
        }),
      )
    : await updateCartMetadata(cartId, {
        ...(cart.metadata ?? {}),
        pickup_checkout_notes: notes?.trim() || null,
        pickup_checkout_payment_provider: "paypal",
        pickup_checkout_ready_at: new Date().toISOString(),
        pickup_checkout_display_currency_code: quote.displayCurrencyCode,
        pickup_checkout_display_total: quote.displayAmount,
        pickup_checkout_charge_currency_code: quote.chargeCurrencyCode,
        pickup_checkout_charge_total: quote.chargeAmount,
        pickup_checkout_exchange_rate: null,
        pickup_checkout_exchange_rate_source: null,
        pickup_checkout_exchange_rate_reference: null,
      });

  const preparedCart = trace
    ? await trace.step(
        "payment_session_init",
        () =>
          initiatePayPalPaymentSession(cartId, paypalProviderId, {
            charge_currency_code: quote.chargeCurrencyCode,
            charge_amount: Math.round(quote.chargeAmount * 100),
            display_currency_code: quote.displayCurrencyCode,
            display_amount: Math.round(quote.displayAmount * 100),
            exchange_rate: quote.exchangeRate,
            exchange_rate_source: quote.exchangeRateSource,
            exchange_rate_reference: quote.exchangeRateReference,
          }),
        (currentCart) => ({
          paymentSessionId: currentCart.paymentSession?.id ?? null,
          paymentOrderId: currentCart.paymentSession?.paypalOrderId ?? null,
        }),
      )
    : await initiatePayPalPaymentSession(cartId, paypalProviderId, {
        charge_currency_code: quote.chargeCurrencyCode,
        charge_amount: Math.round(quote.chargeAmount * 100),
        display_currency_code: quote.displayCurrencyCode,
        display_amount: Math.round(quote.displayAmount * 100),
        exchange_rate: quote.exchangeRate,
        exchange_rate_source: quote.exchangeRateSource,
        exchange_rate_reference: quote.exchangeRateReference,
      });

  return {
    cart: preparedCart,
  };
}

export async function completePayPalCheckout({
  cartId,
  email,
  notes,
  user,
  trace,
}: CheckoutActorInput): Promise<CompletePayPalCheckoutResult> {
  let cart = trace
    ? await trace.step(
        "retrieve_cart",
        () => retrieveCart(cartId),
        (currentCart) => ({
          itemCount: currentCart.summary.itemCount,
          requiresShipping: currentCart.summary.requiresShipping,
          pickupRequestId: currentCart.summary.pickupRequestId,
        }),
      )
    : await retrieveCart(cartId);

  if (cart.summary.pickupRequestId) {
    const existing = trace
      ? await trace.step("retrieve_pickup_request", () =>
          retrievePickupRequest(cart.summary.pickupRequestId!),
        )
      : await retrievePickupRequest(cart.summary.pickupRequestId);

    const finalized = await finalizePickupRequestEmail(
      mapPickupRequest(existing.pickup_request),
      trace,
    );

    return {
      kind: "success",
      ...finalized,
    };
  }

  if (cart.completedAt || cart.summary.pickupRequestStatus === "submitted") {
    const recoveredPickupRequest = await recoverCompletedPickupCheckout(
      cartId,
      cart.summary.pickupRequestId,
      "Checkout ya completado.",
      {
        supabaseUserId: user?.id ?? null,
        notes: notes?.trim() || null,
      },
      trace,
    );

    if (recoveredPickupRequest) {
      const finalized = await finalizePickupRequestEmail(recoveredPickupRequest, trace);

      return {
        kind: "success",
        ...finalized,
      };
    }

    return {
      kind: "stale-cart",
      message: STALE_COMPLETED_CART_MESSAGE,
    };
  }

  const resolvedEmail = await resolveCheckoutEmail(cart, user, email);

  if (!resolvedEmail) {
    throw new Error("Necesitamos un email de contacto antes de completar el pago.");
  }

  if (cart.email !== resolvedEmail) {
    cart = trace
      ? await trace.step("update_cart_email", () => updateCartEmail(cartId, resolvedEmail))
      : await updateCartEmail(cartId, resolvedEmail);
  }

  cart = trace
    ? await trace.step("update_cart_metadata", () =>
        updateCartMetadata(cartId, {
          ...(cart.metadata ?? {}),
          pickup_checkout_notes: notes?.trim() || null,
          pickup_checkout_payment_provider: "paypal",
          pickup_checkout_completed_attempt_at: new Date().toISOString(),
        }),
      )
    : await updateCartMetadata(cartId, {
        ...(cart.metadata ?? {}),
        pickup_checkout_notes: notes?.trim() || null,
        pickup_checkout_payment_provider: "paypal",
        pickup_checkout_completed_attempt_at: new Date().toISOString(),
      });

  cart = await syncCartMember(cart, cartId, user, trace);

  if (
    !cart.paymentSession ||
    !isPayPalPaymentProviderId(cart.paymentSession.providerId) ||
    !cart.paymentSession.paypalOrderId
  ) {
    throw new Error("Primero tienes que preparar la sesión de PayPal antes de aprobar el pago.");
  }

  if (cart.summary.requiresShipping && cart.summary.shippingTotal === 0) {
    await (trace
      ? trace.step(
          "shipping_auto",
          () => addFirstAvailableShippingMethod(cartId),
          (nextCart) => ({
            shippingTotal: nextCart.summary.shippingTotal,
          }),
        )
      : addFirstAvailableShippingMethod(cartId));
  }

  let checkoutResult;

  try {
    checkoutResult = trace
      ? await trace.step(
          "complete_cart",
          () =>
            completeCart(cartId, {
              idempotencyKey: buildCheckoutIdempotencyKey(
                cartId,
                cart.paymentSession!.paypalOrderId!,
              ),
            }),
          (result) => ({
            resultType: result.type,
            orderId: result.type === "order" ? result.order.id ?? null : null,
          }),
        )
      : await completeCart(cartId, {
          idempotencyKey: buildCheckoutIdempotencyKey(cartId, cart.paymentSession.paypalOrderId),
        });
  } catch (checkoutError) {
    const checkoutMessage = getCheckoutErrorMessage(checkoutError);
    const finalized = await resolveRecoveredPickupRequest({
      cartId,
      pickupRequestId: cart.summary.pickupRequestId,
      checkoutMessage,
      user,
      notes,
      trace,
    });

    if (finalized) {
      return {
        kind: "success",
        ...finalized,
      };
    }

    if (isCheckoutInProgressMessage(checkoutMessage)) {
      return {
        kind: "processing",
        message: CHECKOUT_PROCESSING_MESSAGE,
      };
    }

    throw checkoutError;
  }

  if (checkoutResult.type !== "order" || !checkoutResult.order.id) {
    const incompleteCheckout = checkoutResult.type === "cart" ? checkoutResult : null;
    throw new Error(incompleteCheckout?.error ?? "El pago no pudo completarse todavía.");
  }

  trace?.setContext({
    orderId: checkoutResult.order.id,
  });

  const pickupResponse = trace
    ? await trace.step(
        "sync_order",
        () =>
          syncPickupRequestFromOrder(cartId, {
            orderId: checkoutResult.order.id!,
            paypalOrderId: cart.paymentSession?.paypalOrderId ?? null,
            supabaseUserId: user?.id ?? null,
            notes: notes?.trim() || null,
          }),
        (response) => ({
          pickupRequestId: response.pickup_request.id,
        }),
      )
    : await syncPickupRequestFromOrder(cartId, {
        orderId: checkoutResult.order.id,
        paypalOrderId: cart.paymentSession?.paypalOrderId ?? null,
        supabaseUserId: user?.id ?? null,
        notes: notes?.trim() || null,
      });

  const finalized = await finalizePickupRequestEmail(
    mapPickupRequest(pickupResponse.pickup_request),
    trace,
  );

  return {
    kind: "success",
    ...finalized,
  };
}
