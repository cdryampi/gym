import { getDefaultCommerceCurrencyCode } from "@/lib/commerce/currency";
import { getMedusaStorefrontConfig } from "@/lib/medusa/config";
import { getMedusaSdk } from "@/lib/medusa/sdk";
import { normalizeCommerceImageUrl } from "@/lib/commerce/image-urls";
import type { Cart, CartLineItem, SelectedVariant } from "@/lib/cart/types";

export type MedusaCartLineItem = {
  id: string;
  title?: string | null;
  thumbnail?: string | null;
  quantity: number;
  product_id?: string | null;
  product_title?: string | null;
  product_handle?: string | null;
  variant_id?: string | null;
  variant_title?: string | null;
  variant_sku?: string | null;
  unit_price?: number | null;
  subtotal?: number | null;
  total?: number | null;
  requires_shipping?: boolean | null;
  variant_option_values?: Record<string, unknown> | null;
};

export type MedusaCart = {
  id: string;
  email?: string | null;
  customer_id?: string | null;
  region_id?: string | null;
  completed_at?: string | null;
  metadata?: Record<string, unknown> | null;
  currency_code?: string | null;
  subtotal?: number | null;
  total?: number | null;
  tax_total?: number | null;
  shipping_total?: number | null;
  discount_total?: number | null;
  items?: MedusaCartLineItem[] | null;
};

function normalizeAmount(amount: number | null | undefined) {
  return typeof amount === "number" && Number.isFinite(amount) ? amount / 100 : 0;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function mapSelectedOptions(values: Record<string, unknown> | null | undefined): SelectedVariant[] {
  if (!values || typeof values !== "object") {
    return [];
  }

  return Object.entries(values).reduce<SelectedVariant[]>((selectedOptions, [optionTitle, value]) => {
      const normalizedValue = asString(value);

      if (!normalizedValue) {
        return selectedOptions;
      }

      selectedOptions.push({
        optionTitle,
        value: normalizedValue,
      });

      return selectedOptions;
    }, []);
}

function mapLineItem(item: MedusaCartLineItem, currencyCode: string): CartLineItem {
  return {
    id: item.id,
    title: asString(item.title) ?? "Producto en carrito",
    thumbnail: normalizeCommerceImageUrl(asString(item.thumbnail)),
    quantity: item.quantity,
    productId: asString(item.product_id),
    productTitle: asString(item.product_title),
    productHandle: asString(item.product_handle),
    variantId: asString(item.variant_id),
    variantTitle: asString(item.variant_title),
    variantSku: asString(item.variant_sku),
    unitPrice: normalizeAmount(item.unit_price),
    subtotal: normalizeAmount(item.subtotal),
    total: normalizeAmount(item.total),
    currencyCode,
    requiresShipping: Boolean(item.requires_shipping),
    selectedOptions: mapSelectedOptions(item.variant_option_values),
  };
}

export function mapMedusaCart(cart: MedusaCart): Cart {
  const currencyCode =
    asString(cart.currency_code)?.toUpperCase() ?? getDefaultCommerceCurrencyCode();
  const items = (cart.items ?? []).map((item) => mapLineItem(item, currencyCode));
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const metadata = cart.metadata ?? null;

  const result: Cart = {
    id: cart.id,
    email: asString(cart.email),
    customerId: asString(cart.customer_id),
    regionId: asString(cart.region_id),
    completedAt: asString(cart.completed_at),
    metadata,
    items,
    summary: {
      currencyCode,
      itemCount,
      subtotal: normalizeAmount(cart.subtotal),
      total: normalizeAmount(cart.total),
      taxTotal: normalizeAmount(cart.tax_total),
      shippingTotal: normalizeAmount(cart.shipping_total),
      discountTotal: normalizeAmount(cart.discount_total),
      requiresShipping: items.some((item) => item.requiresShipping),
      pickupRequestStatus:
        asString(metadata?.pickup_request_status) === "submitted" ? "submitted" : "draft",
      pickupRequestedAt: asString(metadata?.pickup_requested_at),
      pickupRequestId: asString(metadata?.pickup_request_id),
      pickupRequestNumber: asString(metadata?.pickup_request_number),
    },
  };

  // Defensive check: If there are items but the total is 0, log a warning
  // This helps identify recalculation issues in Medusa v2 early.
  if (items.length > 0 && result.summary.total === 0) {
    console.warn(
      `[Medusa Cart Warning] Cart ${cart.id} has ${items.length} items but total is 0. This might indicate missing calculated fields.`,
    );
  }

  return result;
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

function toCartError(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export async function createCart(email?: string | null) {
  const sdk = getMedusaSdk();

  try {
    const { cart } = await sdk.store.cart.create(
      {
        region_id: getRequiredMedusaRegionId(),
        email: asString(email) ?? undefined,
      },
      {
        fields: "id,currency_code,email,subtotal,total,tax_total,discount_total,items.id,items.unit_price,items.subtotal,items.total,items.quantity,items.title,items.thumbnail,items.product_id,items.product_title,items.product_handle,items.variant_id,items.variant_sku,items.variant_title",
      }
    );

    return mapMedusaCart(cart as MedusaCart);
  } catch (error) {
    throw new Error(`No se pudo crear el carrito: ${toCartError(error, "fallo desconocido")}`);
  }
}

export async function retrieveCart(cartId: string) {
  const sdk = getMedusaSdk();

  try {
    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: "id,currency_code,email,subtotal,total,tax_total,discount_total,items.id,items.unit_price,items.subtotal,items.total,items.quantity,items.title,items.thumbnail,items.product_id,items.product_title,items.product_handle,items.variant_id,items.variant_sku,items.variant_title",
    });
    return mapMedusaCart(cart as MedusaCart);
  } catch (error) {
    throw new Error(`No se pudo cargar el carrito: ${toCartError(error, "fallo desconocido")}`);
  }
}

export async function addCartLineItem(cartId: string, variantId: string, quantity: number) {
  const sdk = getMedusaSdk();

  try {
    const { cart } = await sdk.store.cart.createLineItem(
      cartId,
      {
        variant_id: variantId,
        quantity,
      },
      {
        fields: "id,currency_code,email,subtotal,total,tax_total,discount_total,items.id,items.unit_price,items.subtotal,items.total,items.quantity,items.title,items.thumbnail,items.product_id,items.product_title,items.product_handle,items.variant_id,items.variant_sku,items.variant_title",
      }
    );

    return mapMedusaCart(cart as MedusaCart);
  } catch (error) {
    throw new Error(`No se pudo anadir el producto: ${toCartError(error, "fallo desconocido")}`);
  }
}

export async function updateCartLineItem(cartId: string, lineItemId: string, quantity: number) {
  const sdk = getMedusaSdk();

  try {
    const { cart } = await sdk.store.cart.updateLineItem(
      cartId,
      lineItemId,
      {
        quantity,
      },
      {
        fields: "id,currency_code,email,subtotal,total,tax_total,discount_total,items.id,items.unit_price,items.subtotal,items.total,items.quantity,items.title,items.thumbnail,items.product_id,items.product_title,items.product_handle,items.variant_id,items.variant_sku,items.variant_title",
      }
    );

    return mapMedusaCart(cart as MedusaCart);
  } catch (error) {
    throw new Error(
      `No se pudo actualizar la cantidad: ${toCartError(error, "fallo desconocido")}`,
    );
  }
}

export async function deleteCartLineItem(cartId: string, lineItemId: string) {
  const sdk = getMedusaSdk();

  try {
    const { parent } = await sdk.store.cart.deleteLineItem(cartId, lineItemId, {
      fields: "id,currency_code,email,subtotal,total,tax_total,discount_total,items.id,items.unit_price,items.subtotal,items.total,items.quantity,items.title,items.thumbnail,items.product_id,items.product_title,items.product_handle,items.variant_id,items.variant_sku,items.variant_title",
    });
    return mapMedusaCart(parent as MedusaCart);
  } catch (error) {
    throw new Error(`No se pudo quitar el producto: ${toCartError(error, "fallo desconocido")}`);
  }
}

export async function updateCartEmail(cartId: string, email: string) {
  const sdk = getMedusaSdk();

  try {
    const { cart } = await sdk.store.cart.update(
      cartId,
      {
        email,
      },
      {
        fields: "id,currency_code,email,subtotal,total,tax_total,discount_total,items.id,items.unit_price,items.subtotal,items.total,items.quantity,items.title,items.thumbnail,items.product_id,items.product_title,items.product_handle,items.variant_id,items.variant_sku,items.variant_title",
      }
    );
    return mapMedusaCart(cart as MedusaCart);
  } catch (error) {
    throw new Error(
      `No se pudo guardar el email del carrito: ${toCartError(error, "fallo desconocido")}`,
    );
  }
}
