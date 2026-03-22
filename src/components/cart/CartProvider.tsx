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

import {
  addCartLineItem,
  createCart,
  deleteCartLineItem,
  retrieveCart,
  updateCartEmail,
  updateCartLineItem,
} from "@/lib/cart/medusa";
import type { Cart, PickupRequestDetail } from "@/lib/cart/types";
import {
  clearCartIdCookie,
  getCartIdFromDocumentCookie,
  persistCartIdInCookie,
} from "@/lib/cart/cookie";

export interface CartContextValue {
  cart: Cart | null;
  lastSubmittedPickupRequest: PickupRequestDetail | null;
  pickupEmailWarning: string | null;
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
  requestPickup: (notes?: string) => Promise<void>;
}

export const CartContext = createContext<CartContextValue | null>(null);

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

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
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const lastSyncedSignature = useRef<string | null>(null);

  function commitCart(nextCart: Cart | null) {
    setCart(nextCart);

    if (nextCart?.id) {
      persistCartIdInCookie(nextCart.id);
      return;
    }

    clearCartIdCookie();
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

      if (nextCart.summary.pickupRequestStatus === "submitted") {
        commitCart(null);
        setError(null);
        return;
      }

      commitCart(nextCart);
      setError(null);
    } catch (refreshError) {
      commitCart(null);
      setError(getErrorMessage(refreshError, "No se pudo cargar el carrito."));
    } finally {
      setIsReady(true);
    }
  }

  async function syncCartWithMember(targetCartId: string) {
    const response = await fetch("/api/cart/member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cartId: targetCartId }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { cart?: Cart | null; error?: string }
      | null;

    if (!response.ok) {
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
      setError(
        getErrorMessage(syncError, "No se pudo vincular el carrito a tu cuenta de socio."),
      );
    });
  });

  useEffect(() => {
    hydrateCart();
  }, []);

  useEffect(() => {
    if (!memberEmail) {
      return;
    }

    const cartId = cart?.id ?? getCartIdFromDocumentCookie();

    if (!cartId) {
      return;
    }

    const signature = `${memberEmail}:${cartId}`;

    if (lastSyncedSignature.current === signature) {
      return;
    }

    lastSyncedSignature.current = signature;
    syncMemberCart(cartId);
  }, [memberEmail, cart?.id]);

  async function runBusyAction(action: () => Promise<void>) {
    setIsBusy(true);
    setError(null);

    try {
      await action();
    } catch (actionError) {
      setError(getErrorMessage(actionError, "La operacion del carrito no se pudo completar."));
    } finally {
      setIsBusy(false);
    }
  }

  async function addItem(input: { variantId: string; quantity: number }) {
    await runBusyAction(async () => {
      setLastSubmittedPickupRequest(null);
      setPickupEmailWarning(null);
      const cartId = await ensureCart();
      const nextCart = await addCartLineItem(cartId, input.variantId, input.quantity);
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

  async function requestPickup(notes?: string) {
    if (!cart?.id) {
      setError("No hay un carrito activo para solicitar la recogida.");
      return;
    }

    await runBusyAction(async () => {
      const response = await fetch("/api/cart/pickup-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartId: cart.id,
          notes,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { pickupRequest?: PickupRequestDetail; emailWarning?: string | null; error?: string }
        | null;

      if (!response.ok || !payload?.pickupRequest) {
        throw new Error(payload?.error ?? "No se pudo registrar la recogida.");
      }

      commitCart(null);
      setLastSubmittedPickupRequest(payload.pickupRequest);
      setPickupEmailWarning(payload.emailWarning ?? null);
      startTransition(() => {
        setDrawerOpen(false);
      });
    });
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        lastSubmittedPickupRequest,
        pickupEmailWarning,
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
        requestPickup,
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
