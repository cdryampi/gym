import { getMedusaStorefrontConfig } from "@/lib/medusa/config";
import { PAYPAL_PAYMENT_PROVIDER_ID } from "@/lib/medusa/paypal-provider";
import { getMedusaSdk } from "@/lib/medusa/sdk";

import { mapMedusaCart, MEDUSA_CART_FIELDS } from "./medusa-mapper";
import {
  asString,
  isCheckoutConflictError,
  toCartError,
  type CompleteCartResult,
  type MedusaCart,
  type MedusaShippingOption,
  type MedusaStoreOrder,
} from "./medusa-shared";

type BrowserCartApiPayload = {
  cart?: ReturnType<typeof mapMedusaCart>;
  error?: string;
};

function isBrowserRuntime() {
  return typeof window !== "undefined";
}

async function readBrowserCartApiResponse(response: Response) {
  return (await response.json().catch(() => null)) as BrowserCartApiPayload | null;
}

async function callBrowserCartApi(
  input:
    | { method: "GET"; cartId: string }
    | {
        method: "POST";
        body:
          | { action: "create"; email?: string | null }
          | { action: "add-item"; cartId: string; variantId: string; quantity: number }
          | { action: "update-item"; cartId: string; lineItemId: string; quantity: number }
          | { action: "delete-item"; cartId: string; lineItemId: string }
          | { action: "update-email"; cartId: string; email: string };
      },
) {
  const response =
    input.method === "GET"
      ? await fetch(`/api/cart/store?cartId=${encodeURIComponent(input.cartId)}`, {
          method: "GET",
          credentials: "same-origin",
        })
      : await fetch("/api/cart/store", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input.body),
        });

  const payload = await readBrowserCartApiResponse(response);

  if (!response.ok || !payload?.cart) {
    throw new Error(payload?.error ?? "No se pudo completar la operacion del carrito.");
  }

  return payload.cart;
}

function getRequiredMedusaRegionId() {
  const config = getMedusaStorefrontConfig();

  if (!config.regionId) {
    throw new Error(
      "Falta MEDUSA_REGION_ID o NEXT_PUBLIC_MEDUSA_REGION_ID para crear el carrito del storefront.",
    );
  }

  return config.regionId;
}

async function retrieveRawCart(cartId: string) {
  const sdk = getMedusaSdk();
  const { cart } = await sdk.store.cart.retrieve(cartId, {
    fields: MEDUSA_CART_FIELDS,
  });
  return cart as MedusaCart;
}

export async function createCart(email?: string | null) {
  if (isBrowserRuntime()) {
    return callBrowserCartApi({
      method: "POST",
      body: {
        action: "create",
        email,
      },
    });
  }

  const sdk = getMedusaSdk();
  const config = getMedusaStorefrontConfig();

  try {
    const { cart } = await sdk.store.cart.create(
      {
        region_id: getRequiredMedusaRegionId(),
        email: asString(email) ?? undefined,
      },
      {
        fields: MEDUSA_CART_FIELDS,
      },
    );

    return mapMedusaCart(cart as MedusaCart);
  } catch (error) {
    throw new Error(`No se pudo crear el carrito en ${config.backendUrl}: ${toCartError(error, "fallo desconocido")}`);
  }
}

export async function retrieveCart(cartId: string) {
  if (isBrowserRuntime()) {
    return callBrowserCartApi({
      method: "GET",
      cartId,
    });
  }

  const sdk = getMedusaSdk();
  const config = getMedusaStorefrontConfig();

  try {
    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: MEDUSA_CART_FIELDS,
    });
    return mapMedusaCart(cart as MedusaCart);
  } catch (error) {
    throw new Error(`No se pudo cargar el carrito ${cartId} desde ${config.backendUrl}: ${toCartError(error, "fallo desconocido")}`);
  }
}

export async function addCartLineItem(cartId: string, variantId: string, quantity: number) {
  if (isBrowserRuntime()) {
    return callBrowserCartApi({
      method: "POST",
      body: {
        action: "add-item",
        cartId,
        variantId,
        quantity,
      },
    });
  }

  const sdk = getMedusaSdk();

  try {
    const { cart } = await sdk.store.cart.createLineItem(
      cartId,
      {
        variant_id: variantId,
        quantity,
      },
      {
        fields: MEDUSA_CART_FIELDS,
      },
    );

    return mapMedusaCart(cart as MedusaCart);
  } catch (error) {
    throw new Error(`No se pudo añadir el producto: ${toCartError(error, "fallo desconocido")}`);
  }
}

export async function updateCartLineItem(cartId: string, lineItemId: string, quantity: number) {
  if (isBrowserRuntime()) {
    return callBrowserCartApi({
      method: "POST",
      body: {
        action: "update-item",
        cartId,
        lineItemId,
        quantity,
      },
    });
  }

  const sdk = getMedusaSdk();

  try {
    const { cart } = await sdk.store.cart.updateLineItem(
      cartId,
      lineItemId,
      {
        quantity,
      },
      {
        fields: MEDUSA_CART_FIELDS,
      },
    );

    return mapMedusaCart(cart as MedusaCart);
  } catch (error) {
    throw new Error(
      `No se pudo actualizar la cantidad: ${toCartError(error, "fallo desconocido")}`,
    );
  }
}

export async function deleteCartLineItem(cartId: string, lineItemId: string) {
  if (isBrowserRuntime()) {
    return callBrowserCartApi({
      method: "POST",
      body: {
        action: "delete-item",
        cartId,
        lineItemId,
      },
    });
  }

  const sdk = getMedusaSdk();

  try {
    const { parent } = await sdk.store.cart.deleteLineItem(cartId, lineItemId, {
      fields: MEDUSA_CART_FIELDS,
    });
    return mapMedusaCart(parent as MedusaCart);
  } catch (error) {
    throw new Error(`No se pudo quitar el producto: ${toCartError(error, "fallo desconocido")}`);
  }
}

export async function updateCartEmail(cartId: string, email: string) {
  if (isBrowserRuntime()) {
    return callBrowserCartApi({
      method: "POST",
      body: {
        action: "update-email",
        cartId,
        email,
      },
    });
  }

  const sdk = getMedusaSdk();

  try {
    const { cart } = await sdk.store.cart.update(
      cartId,
      {
        email,
      },
      {
        fields: MEDUSA_CART_FIELDS,
      },
    );
    return mapMedusaCart(cart as MedusaCart);
  } catch (error) {
    throw new Error(
      `No se pudo guardar el email del carrito: ${toCartError(error, "fallo desconocido")}`,
    );
  }
}

export async function updateCartMetadata(cartId: string, metadata: Record<string, unknown>) {
  const sdk = getMedusaSdk();

  try {
    const { cart } = await sdk.store.cart.update(
      cartId,
      {
        metadata,
      },
      {
        fields: MEDUSA_CART_FIELDS,
      },
    );

    return mapMedusaCart(cart as MedusaCart);
  } catch (error) {
    throw new Error(
      `No se pudo guardar el contexto del checkout: ${toCartError(error, "fallo desconocido")}`,
    );
  }
}

export async function initiatePayPalPaymentSession(
  cartId: string,
  providerId: string = PAYPAL_PAYMENT_PROVIDER_ID,
  paymentData?: Record<string, unknown>,
) {
  const sdk = getMedusaSdk();

  try {
    const rawCart = await retrieveRawCart(cartId);
    await sdk.store.payment.initiatePaymentSession(
      rawCart as never,
      {
        provider_id: providerId,
        data: paymentData,
      },
      {
        fields: "*payment_sessions",
      },
    );

    return await retrieveCart(cartId);
  } catch (error) {
    throw new Error(
      `No se pudo preparar el pago con PayPal: ${toCartError(error, "fallo desconocido")}`,
    );
  }
}

export async function addFirstAvailableShippingMethod(cartId: string) {
  const sdk = getMedusaSdk();
  const existingCart = await retrieveRawCart(cartId);

  if (Array.isArray(existingCart.shipping_methods) && existingCart.shipping_methods.length > 0) {
    return mapMedusaCart(existingCart);
  }

  const countryCode = (
    process.env.MEDUSA_COUNTRY_CODE ||
    process.env.NEXT_PUBLIC_COMMERCE_COUNTRY_CODE ||
    "pe"
  ).toLowerCase();

  await sdk.store.cart.update(cartId, {
    shipping_address: { country_code: countryCode },
  });

  const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
    cart_id: cartId,
  });

  if (!shipping_options || shipping_options.length === 0) {
    throw new Error(
      `No hay métodos de envío disponibles para el carrito ${cartId}. Revisa la configuración de zonas en Medusa.`,
    );
  }

  const rejectedOptions: string[] = [];

  for (const option of shipping_options as MedusaShippingOption[]) {
    if (!option?.id) {
      continue;
    }

    try {
      const { cart } = await sdk.store.cart.addShippingMethod(
        cartId,
        {
          option_id: option.id,
        },
        {
          fields: MEDUSA_CART_FIELDS,
        },
      );

      return mapMedusaCart(cart as MedusaCart);
    } catch (error) {
      rejectedOptions.push(
        [option.id, asString(option.name), toCartError(error, "sin precio calculable")]
          .filter(Boolean)
          .join(" / "),
      );
    }
  }

  const diagnostic =
    rejectedOptions.length > 0
      ? ` Opciones rechazadas: ${rejectedOptions.join("; ")}.`
      : "";

  throw new Error(
    `Medusa devolvió métodos de envío sin precio para el carrito ${cartId}. Revisa la shipping option de pickup en Medusa.${diagnostic}`,
  );
}

export async function completeCart(
  cartId: string,
  options?: {
    idempotencyKey?: string | null;
  },
): Promise<CompleteCartResult> {
  const sdk = getMedusaSdk();
  const completeHeaders = options?.idempotencyKey
    ? {
        "Idempotency-Key": options.idempotencyKey,
      }
    : undefined;

  try {
    console.log(`[Medusa Cart] Intentando completar el carrito: ${cartId}`);
    const result = (await sdk.store.cart.complete(
      cartId,
      undefined,
      completeHeaders,
    )) as
      | { type?: string; order?: MedusaStoreOrder; cart?: MedusaCart; error?: unknown }
      | undefined;

    console.log(
      `[Medusa Cart] Resultado de completeCart para ${cartId}:`,
      JSON.stringify(result, null, 2),
    );

    if (!result) {
      console.error(`[Medusa Cart Error] No se recibió respuesta al completar el carrito ${cartId}`);
      return {
        type: "cart",
        cart: { id: cartId } as MedusaCart,
        error: "No response from complete cart",
      };
    }

    if (result.type === "order" && result.order?.id) {
      return {
        type: "order",
        order: result.order,
      };
    }

    if (result.type === "cart" && result.cart?.id) {
      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : result.error && typeof result.error === "object" && "message" in result.error
            ? String(result.error.message)
            : "El checkout no pudo completarse.";

      return {
        type: "cart",
        cart: result.cart,
        error: errorMessage,
      };
    }

    throw new Error("Medusa devolvió una respuesta de checkout no reconocida.");
  } catch (error) {
    const message = toCartError(error, "fallo desconocido");

    if (isCheckoutConflictError(error)) {
      throw new Error(`Checkout ya en progreso: ${message}`);
    }

    throw new Error(`No se pudo completar el checkout: ${message}`);
  }
}
