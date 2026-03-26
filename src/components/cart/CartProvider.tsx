"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { postJson } from "@/lib/cart/browser-api";
import {
  clearCartIdCookie,
  getCartIdFromDocumentCookie,
  persistCartIdInCookie,
} from "@/lib/cart/cookie";
import {
  addCartLineItem,
  createCart,
  deleteCartLineItem,
  retrieveCart,
  updateCartEmail,
  updateCartLineItem,
} from "@/lib/cart/medusa";
import { getErrorMessage, isMissingCartMessage, STALE_CART_MESSAGE } from "@/lib/cart/runtime";
import type { Cart, PickupRequestDetail } from "@/lib/cart/types";

export interface CartContextValue {
  cart: Cart | null;
  lastSubmittedPickupRequest: PickupRequestDetail | null;
  pickupEmailWarning: string | null;
  notice: string | null;
  memberEmail: string | null;
  error: string | null;
  isReady: boolean;
  isBusy: boolean;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  clearSubmittedPickupRequest: () => void;
  refreshCart: () => Promise<void>;
  addItem: (input: { variantId: string; quantity: number }) => Promise<void>;
  updateItemQuantity: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  saveEmail: (email: string) => Promise<void>;
  preparePayPalCheckout: (input?: {
    email?: string;
    notes?: string;
  }) => Promise<Cart | null>;
  completePayPalCheckout: (input?: {
    email?: string;
    notes?: string;
  }) => Promise<PickupRequestDetail | "processing" | null>;
}

export const CartContext = createContext<CartContextValue | null>(null);

type CartApiPayload = { cart?: Cart | null; error?: string };
type PickupCheckoutPayload = {
  pickupRequest?: PickupRequestDetail;
  emailWarning?: string | null;
  error?: string;
  processing?: boolean;
  message?: string;
};

export function CartProvider({
  children,
  memberEmail = null,
}: Readonly<{
  children: ReactNode;
  memberEmail?: string | null;
}>) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [lastSubmittedPickupRequest, setLastSubmittedPickupRequest] =
    useState<PickupRequestDetail | null>(null);
  const [pickupEmailWarning, setPickupEmailWarning] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const lastSyncedSignature = useRef<string | null>(null);
  const completeCheckoutInFlightRef = useRef(false);

  function commitCart(nextCart: Cart | null) {
    setCart(nextCart);

    if (nextCart?.id) {
      persistCartIdInCookie(nextCart.id);
      return;
    }

    clearCartIdCookie();
  }

  function invalidateBrokenCart(message?: string | null) {
    commitCart(null);
    setLastSubmittedPickupRequest(null);
    setPickupEmailWarning(null);
    setNotice(null);
    lastSyncedSignature.current = null;

    if (message) {
      setError(message);
    }
  }

  async function refreshCart() {
    const cartId = getCartIdFromDocumentCookie();

    if (!cartId) {
      commitCart(null);
      setIsReady(true);
      return;
    }

    try {
      const nextCart = await retrieveCart(cartId);

      if (nextCart.summary.pickupRequestStatus === "submitted" || nextCart.completedAt) {
        commitCart(null);
        setError(null);
        return;
      }

      commitCart(nextCart);
      setError(null);
      setNotice(null);
    } catch (refreshError) {
      invalidateBrokenCart(
        isMissingCartMessage(getErrorMessage(refreshError, ""))
          ? STALE_CART_MESSAGE
          : getErrorMessage(refreshError, "No se pudo cargar el carrito."),
      );
    } finally {
      setIsReady(true);
    }
  }

  async function syncCartWithMember(targetCartId: string) {
    const { response, payload } = await postJson<CartApiPayload>("/api/cart/member", {
      cartId: targetCartId,
    });

    if (!response.ok) {
      if (isMissingCartMessage(payload?.error ?? null)) {
        invalidateBrokenCart(STALE_CART_MESSAGE);
      }
      throw new Error(payload?.error ?? "No se pudo vincular el carrito a la cuenta.");
    }

    if (payload?.cart) {
      commitCart(payload.cart);
      return payload.cart;
    }

    return null;
  }

  async function ensureCart() {
    if (cart?.id) {
      return cart.id;
    }

    setLastSubmittedPickupRequest(null);
    setPickupEmailWarning(null);
    const nextCart = await createCart(memberEmail);
    commitCart(nextCart);
    return nextCart.id;
  }

  const hydrateCart = useEffectEvent(() => {
    void refreshCart();
  });

  const syncMemberCart = useEffectEvent((cartId: string) => {
    void syncCartWithMember(cartId).catch((syncError) => {
      const message = getErrorMessage(
        syncError,
        "No se pudo vincular el carrito a tu cuenta de socio.",
      );

      if (isMissingCartMessage(message)) {
        return;
      }

      setError(message);
    });
  });

  useEffect(() => {
    hydrateCart();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!memberEmail) {
      return;
    }

    const cartId = cart?.id;

    if (!cartId) {
      return;
    }

    const signature = `${memberEmail}:${cartId}`;

    if (lastSyncedSignature.current === signature) {
      return;
    }

    lastSyncedSignature.current = signature;
    syncMemberCart(cartId);
  }, [isReady, memberEmail, cart?.id]);

  async function runBusyAction(action: () => Promise<void>) {
    setIsBusy(true);
    setError(null);
    setNotice(null);

    try {
      await action();
    } catch (actionError) {
      const message = getErrorMessage(actionError, "La operación del carrito no se pudo completar.");

      if (isMissingCartMessage(message)) {
        invalidateBrokenCart(STALE_CART_MESSAGE);
        return;
      }

      setError(message);
    } finally {
      setIsBusy(false);
    }
  }

  async function addItem(input: { variantId: string; quantity: number }) {
    await runBusyAction(async () => {
      setLastSubmittedPickupRequest(null);
      setPickupEmailWarning(null);
      let cartId = await ensureCart();
      let nextCart: Cart;

      try {
        nextCart = await addCartLineItem(cartId, input.variantId, input.quantity);
      } catch (addError) {
        const message = getErrorMessage(addError, "No se pudo anadir el producto.");

        if (!isMissingCartMessage(message)) {
          throw addError;
        }

        const replacementCart = await createCart(memberEmail);
        commitCart(replacementCart);
        cartId = replacementCart.id;
        nextCart = await addCartLineItem(cartId, input.variantId, input.quantity);
      }

      commitCart(nextCart);

      if (memberEmail && !nextCart.customerId) {
        const syncedCart = await syncCartWithMember(nextCart.id);
        commitCart(syncedCart ?? nextCart);
      }

      startTransition(() => {
        setDrawerOpen(true);
      });
    });
  }

  async function updateItemQuantity(lineItemId: string, quantity: number) {
    if (!cart?.id) {
      return;
    }

    if (quantity <= 0) {
      await removeItem(lineItemId);
      return;
    }

    await runBusyAction(async () => {
      const nextCart = await updateCartLineItem(cart.id, lineItemId, quantity);
      commitCart(nextCart);
    });
  }

  async function removeItem(lineItemId: string) {
    if (!cart?.id) {
      return;
    }

    await runBusyAction(async () => {
      const nextCart = await deleteCartLineItem(cart.id, lineItemId);
      commitCart(nextCart);
    });
  }

  async function saveEmail(email: string) {
    await runBusyAction(async () => {
      const cartId = await ensureCart();
      const nextCart = await updateCartEmail(cartId, email);
      commitCart(nextCart);
    });
  }

  async function preparePayPalCheckout(input?: {
    email?: string;
    notes?: string;
  }) {
    if (!cart?.id) {
      setError("No hay un carrito activo para preparar el pago.");
      return null;
    }

      setIsBusy(true);
      setError(null);
      setNotice(null);

    try {
      const { response, payload } = await postJson<CartApiPayload>(
        "/api/cart/checkout/paypal/init",
        {
          cartId: cart.id,
          email: input?.email,
          notes: input?.notes,
        },
      );

      if (!response.ok || !payload?.cart) {
        throw new Error(payload?.error ?? "No se pudo preparar PayPal.");
      }

      commitCart(payload.cart);
      return payload.cart;
    } catch (actionError) {
      const message = getErrorMessage(actionError, "No se pudo preparar PayPal.");

      if (isMissingCartMessage(message)) {
        invalidateBrokenCart(STALE_CART_MESSAGE);
        return null;
      }

      setError(message);
      return null;
    } finally {
      setIsBusy(false);
    }
  }

  async function completePayPalCheckout(input?: {
    email?: string;
    notes?: string;
  }) {
    if (!cart?.id) {
      setError("No hay un carrito activo para completar el pago.");
      return null;
    }

    if (completeCheckoutInFlightRef.current) {
      return null;
    }

    completeCheckoutInFlightRef.current = true;
    setIsBusy(true);
    setError(null);

    try {
      const { response, payload } = await postJson<PickupCheckoutPayload>(
        "/api/cart/checkout/paypal/complete",
        {
          cartId: cart.id,
          email: input?.email,
          notes: input?.notes,
        },
      );

      if (response.status === 202 && payload?.processing) {
        setNotice(
          payload.message ??
            payload.error ??
            "PayPal ya ha confirmado tu pago. Estamos terminando de registrar tu pedido.",
        );
        startTransition(() => {
          setDrawerOpen(false);
        });
        return "processing";
      }

      if (!response.ok || !payload?.pickupRequest) {
        throw new Error(payload?.error ?? "No se pudo completar el pago con PayPal.");
      }

      commitCart(null);
      setLastSubmittedPickupRequest(payload.pickupRequest);
      setPickupEmailWarning(payload.emailWarning ?? null);
      startTransition(() => {
        setDrawerOpen(false);
      });

      return payload.pickupRequest;
    } catch (actionError) {
      const message = getErrorMessage(actionError, "No se pudo completar el pago con PayPal.");

      if (isMissingCartMessage(message)) {
        invalidateBrokenCart(STALE_CART_MESSAGE);
        return null;
      }

      setError(message);
      return null;
    } finally {
      completeCheckoutInFlightRef.current = false;
      setIsBusy(false);
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        lastSubmittedPickupRequest,
        pickupEmailWarning,
        notice,
        memberEmail,
        error,
        isReady,
        isBusy,
        isDrawerOpen,
        setDrawerOpen,
        clearSubmittedPickupRequest: () => {
          setLastSubmittedPickupRequest(null);
          setPickupEmailWarning(null);
        },
        refreshCart,
        addItem,
        updateItemQuantity,
        removeItem,
        saveEmail,
        preparePayPalCheckout,
        completePayPalCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider.");
  }

  return context;
}
