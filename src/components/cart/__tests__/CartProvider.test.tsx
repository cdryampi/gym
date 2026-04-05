// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { STALE_CART_MESSAGE } from "@/lib/cart/runtime";
import type { Cart, PickupRequestDetail } from "@/lib/cart/types";

const cartMedusaMocks = vi.hoisted(() => ({
  addCartLineItem: vi.fn(),
  createCart: vi.fn(),
  deleteCartLineItem: vi.fn(),
  retrieveCart: vi.fn(),
  updateCartEmail: vi.fn(),
  updateCartLineItem: vi.fn(),
}));

vi.mock("@/lib/cart/medusa", () => ({
  addCartLineItem: cartMedusaMocks.addCartLineItem,
  createCart: cartMedusaMocks.createCart,
  deleteCartLineItem: cartMedusaMocks.deleteCartLineItem,
  retrieveCart: cartMedusaMocks.retrieveCart,
  updateCartEmail: cartMedusaMocks.updateCartEmail,
  updateCartLineItem: cartMedusaMocks.updateCartLineItem,
}));

function buildCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: "cart_cookie",
    email: "guest@gym.com",
    customerId: null,
    regionId: "reg_test",
    completedAt: null,
    metadata: null,
    paymentSession: null,
    items: [
      {
        id: "line_01",
        title: "Nova Whey",
        thumbnail: null,
        quantity: 1,
        productId: "prod_01",
        productTitle: "Nova Whey",
        productHandle: "nova-whey",
        variantId: "variant_01",
        variantTitle: "Chocolate",
        variantSku: null,
        unitPrice: 49.99,
        subtotal: 49.99,
        total: 49.99,
        currencyCode: "PEN",
        requiresShipping: false,
        selectedOptions: [],
      },
    ],
    summary: {
      currencyCode: "PEN",
      itemCount: 1,
      subtotal: 49.99,
      total: 49.99,
      taxTotal: 0,
      shippingTotal: 0,
      discountTotal: 0,
      requiresShipping: false,
      pickupRequestStatus: "draft",
      pickupRequestedAt: null,
      pickupRequestId: null,
      pickupRequestNumber: null,
    },
    ...overrides,
  };
}

function CartProbe() {
  const { cart, isReady, error } = useCart();

  return (
    <div>
      <span>{isReady ? "ready" : "loading"}</span>
      <span>{cart?.id ?? "no-cart"}</span>
      <span>{cart?.summary.itemCount ?? 0}</span>
      <span>{cart?.customerId ?? "guest"}</span>
      <span>{error ?? "no-error"}</span>
    </div>
  );
}

function buildPickupRequest(): PickupRequestDetail {
  return {
    id: "pick_01",
    requestNumber: "NF-20260322-ABC123",
    cartId: "cart_cookie",
    customerId: null,
    supabaseUserId: null,
    email: "guest@gym.com",
    notes: "Pasaré por la tarde.",
    status: "requested",
    currencyCode: "PEN",
    itemCount: 1,
    subtotal: 49.99,
    total: 49.99,
    chargedCurrencyCode: "USD",
    chargedTotal: 14.8,
    exchangeRate: 3.377,
    exchangeRateSource: "BCRP PD04640PD",
    exchangeRateReference: "19.Mar.26",
    lineItems: [],
    source: "gym-storefront",
    orderId: null,
    paymentCollectionId: null,
    paymentProvider: null,
    paymentStatus: "pending",
    paypalOrderId: null,
    paypalCaptureId: null,
    paymentAuthorizedAt: null,
    paymentCapturedAt: null,
    emailStatus: "sent",
    emailSentAt: "2026-03-22T12:00:00.000Z",
    emailError: null,
    createdAt: "2026-03-22T10:00:00.000Z",
    updatedAt: "2026-03-22T12:00:00.000Z",
  };
}

function CartPickupProbe() {
  const { cart, lastSubmittedPickupRequest, completePayPalCheckout } = useCart();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          void completePayPalCheckout({ notes: "Pasaré por la tarde." });
        }}
      >
        Completar checkout
      </button>
      <span>{cart?.id ?? "no-cart"}</span>
      <span>{lastSubmittedPickupRequest?.requestNumber ?? "no-request"}</span>
    </div>
  );
}

function CartAddProbe() {
  const { cart, error, addItem } = useCart();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          void addItem({ variantId: "variant_vanilla", quantity: 1 });
        }}
      >
        Anadir
      </button>
      <span>{cart?.id ?? "no-cart"}</span>
      <span>{cart?.summary.itemCount ?? 0}</span>
      <span>{error ?? "no-error"}</span>
    </div>
  );
}

describe("CartProvider", () => {
  beforeEach(() => {
    document.cookie = "gym_cart_id=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    cartMedusaMocks.addCartLineItem.mockReset();
    cartMedusaMocks.createCart.mockReset();
    cartMedusaMocks.deleteCartLineItem.mockReset();
    cartMedusaMocks.retrieveCart.mockReset();
    cartMedusaMocks.updateCartEmail.mockReset();
    cartMedusaMocks.updateCartLineItem.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hydrates the active cart from the storefront cookie", async () => {
    document.cookie = "gym_cart_id=cart_cookie; path=/";
    cartMedusaMocks.retrieveCart.mockResolvedValue(buildCart());

    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("ready")).toBeInTheDocument();
      expect(screen.getByText("cart_cookie")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    expect(cartMedusaMocks.retrieveCart).toHaveBeenCalledWith("cart_cookie");
  });

  it("clears the broken cart cookie when the active cart can no longer be recovered", async () => {
    document.cookie = "gym_cart_id=cart_cookie; path=/";
    cartMedusaMocks.retrieveCart.mockRejectedValue(
      new Error("Cart with id cart_cookie does not exist"),
    );

    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("ready")).toBeInTheDocument();
      expect(screen.getByText("no-cart")).toBeInTheDocument();
      expect(screen.getByText("no-error")).toBeInTheDocument();
    });

    expect(document.cookie).not.toContain("gym_cart_id=");
  });

  it("tries to recover the member cart after clearing a stale cookie cart", async () => {
    document.cookie = "gym_cart_id=cart_cookie; path=/";
    cartMedusaMocks.retrieveCart.mockRejectedValue(
      new Error("Cart with id cart_cookie does not exist"),
    );
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          cart: null,
        }),
      ),
    );

    render(
      <CartProvider memberEmail="socio@gym.com">
        <CartProbe />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("ready")).toBeInTheDocument();
      expect(screen.getByText("no-cart")).toBeInTheDocument();
      expect(screen.getByText("no-error")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith("/api/cart/member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    expect(document.cookie).not.toContain("gym_cart_id=");
  });

  it("recovers the active member cart when the cookie is missing but the session is still valid", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          cart: buildCart({
            id: "cart_member_active",
            customerId: "cus_01",
          }),
        }),
      ),
    );

    render(
      <CartProvider memberEmail="socio@gym.com">
        <CartProbe />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("cart_member_active")).toBeInTheDocument();
      expect(screen.getByText("cus_01")).toBeInTheDocument();
      expect(screen.getByText("no-error")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith("/api/cart/member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    expect(document.cookie).toContain("gym_cart_id=cart_member_active");
  });

  it("keeps the guest cart and associates it to the signed-in member", async () => {
    document.cookie = "gym_cart_id=cart_cookie; path=/";
    cartMedusaMocks.retrieveCart.mockResolvedValue(buildCart());
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          cart: buildCart({
            customerId: "cus_01",
          }),
        }),
      ),
    );

    render(
      <CartProvider memberEmail="socio@gym.com">
        <CartProbe />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("cus_01")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith("/api/cart/member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cartId: "cart_cookie" }),
    });
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("clears the cart when member sync hits a cart that is already completed", async () => {
    document.cookie = "gym_cart_id=cart_cookie; path=/";
    cartMedusaMocks.retrieveCart.mockResolvedValue(buildCart());
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          error:
            "No se pudo vincular el carrito a la cuenta del miembro: Cart cart_cookie is already completed.",
        }),
        { status: 500 },
      ),
    );

    render(
      <CartProvider memberEmail="socio@gym.com">
        <CartProbe />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("no-cart")).toBeInTheDocument();
      expect(screen.getByText(STALE_CART_MESSAGE)).toBeInTheDocument();
    });

    expect(document.cookie).not.toContain("gym_cart_id=");
  });

  it("clears the active cart and stores the submitted pickup request after checkout", async () => {
    const user = userEvent.setup();
    document.cookie = "gym_cart_id=cart_cookie; path=/";
    cartMedusaMocks.retrieveCart.mockResolvedValue(buildCart());

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          pickupRequest: buildPickupRequest(),
          emailWarning: null,
        }),
      ),
    );

    render(
      <CartProvider>
        <CartPickupProbe />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("cart_cookie")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Completar checkout" }));

    await waitFor(() => {
      expect(screen.getByText("no-cart")).toBeInTheDocument();
      expect(screen.getByText("NF-20260322-ABC123")).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith("/api/cart/checkout/paypal/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cartId: "cart_cookie",
        notes: "Pasaré por la tarde.",
      }),
    });
  });

  it("recreates the cart and retries addItem once when Medusa reports the current cart is missing", async () => {
    const user = userEvent.setup();
    document.cookie = "gym_cart_id=cart_cookie; path=/";
    cartMedusaMocks.retrieveCart.mockResolvedValue(buildCart());
    cartMedusaMocks.createCart.mockResolvedValue(
      buildCart({
        id: "cart_new",
        items: [],
        summary: {
          currencyCode: "PEN",
          itemCount: 0,
          subtotal: 0,
          total: 0,
          taxTotal: 0,
          shippingTotal: 0,
          discountTotal: 0,
          requiresShipping: false,
          pickupRequestStatus: "draft",
          pickupRequestedAt: null,
          pickupRequestId: null,
          pickupRequestNumber: null,
        },
      }),
    );
    cartMedusaMocks.addCartLineItem
      .mockRejectedValueOnce(new Error("Cart with id cart_cookie does not exist"))
      .mockResolvedValueOnce(
        buildCart({
          id: "cart_new",
          items: [
            {
              id: "line_02",
              title: "Nova Whey",
              thumbnail: null,
              quantity: 1,
              productId: "prod_01",
              productTitle: "Nova Whey",
              productHandle: "nova-whey",
              variantId: "variant_vanilla",
              variantTitle: "Vanilla",
              variantSku: null,
              unitPrice: 49.99,
              subtotal: 49.99,
              total: 49.99,
              currencyCode: "PEN",
              requiresShipping: false,
              selectedOptions: [],
            },
          ],
        }),
      );

    render(
      <CartProvider>
        <CartAddProbe />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("cart_cookie")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Anadir" }));

    await waitFor(() => {
      expect(screen.getByText("cart_new")).toBeInTheDocument();
      expect(screen.getByText("no-error")).toBeInTheDocument();
    });

    expect(cartMedusaMocks.createCart).toHaveBeenCalledWith(null);
    expect(cartMedusaMocks.addCartLineItem).toHaveBeenNthCalledWith(
      1,
      "cart_cookie",
      "variant_vanilla",
      1,
    );
    expect(cartMedusaMocks.addCartLineItem).toHaveBeenNthCalledWith(
      2,
      "cart_new",
      "variant_vanilla",
      1,
    );
  });

  it("recovers the active member cart before creating a new one when there is no cookie cart", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          cart: buildCart({
            id: "cart_member_active",
            customerId: "cus_01",
          }),
        }),
      ),
    );
    cartMedusaMocks.addCartLineItem.mockResolvedValue(
      buildCart({
        id: "cart_member_active",
        customerId: "cus_01",
        items: [
          {
            id: "line_02",
            title: "Nova Whey",
            thumbnail: null,
            quantity: 2,
            productId: "prod_01",
            productTitle: "Nova Whey",
            productHandle: "nova-whey",
            variantId: "variant_vanilla",
            variantTitle: "Vanilla",
            variantSku: null,
            unitPrice: 49.99,
            subtotal: 99.98,
            total: 99.98,
            currencyCode: "PEN",
            requiresShipping: false,
            selectedOptions: [],
          },
        ],
        summary: {
          currencyCode: "PEN",
          itemCount: 2,
          subtotal: 99.98,
          total: 99.98,
          taxTotal: 0,
          shippingTotal: 0,
          discountTotal: 0,
          requiresShipping: false,
          pickupRequestStatus: "draft",
          pickupRequestedAt: null,
          pickupRequestId: null,
          pickupRequestNumber: null,
        },
      }),
    );

    render(
      <CartProvider memberEmail="socio@gym.com">
        <CartAddProbe />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("cart_member_active")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Anadir" }));

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("no-error")).toBeInTheDocument();
    });

    expect(cartMedusaMocks.createCart).not.toHaveBeenCalled();
    expect(cartMedusaMocks.addCartLineItem).toHaveBeenCalledWith(
      "cart_member_active",
      "variant_vanilla",
      1,
    );
  });

  it("abandons the broken cart and retries with a fresh one when Medusa fails with fetch error", async () => {
    const user = userEvent.setup();
    document.cookie = "gym_cart_id=cart_cookie; path=/";
    cartMedusaMocks.retrieveCart.mockResolvedValue(buildCart());
    cartMedusaMocks.createCart.mockResolvedValue(
      buildCart({
        id: "cart_replacement",
        items: [],
        summary: {
          currencyCode: "PEN",
          itemCount: 0,
          subtotal: 0,
          total: 0,
          taxTotal: 0,
          shippingTotal: 0,
          discountTotal: 0,
          requiresShipping: false,
          pickupRequestStatus: "draft",
          pickupRequestedAt: null,
          pickupRequestId: null,
          pickupRequestNumber: null,
        },
      }),
    );
    cartMedusaMocks.addCartLineItem
      .mockRejectedValueOnce(new Error("No se pudo anadir el producto: Failed to fetch"))
      .mockResolvedValueOnce(
        buildCart({
          id: "cart_replacement",
          items: [
            {
              id: "line_03",
              title: "Nova Whey",
              thumbnail: null,
              quantity: 1,
              productId: "prod_01",
              productTitle: "Nova Whey",
              productHandle: "nova-whey",
              variantId: "variant_vanilla",
              variantTitle: "Vanilla",
              variantSku: null,
              unitPrice: 49.99,
              subtotal: 49.99,
              total: 49.99,
              currencyCode: "PEN",
              requiresShipping: false,
              selectedOptions: [],
            },
          ],
        }),
      );

    render(
      <CartProvider>
        <CartAddProbe />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("cart_cookie")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Anadir" }));

    await waitFor(() => {
      expect(screen.getByText("cart_replacement")).toBeInTheDocument();
      expect(screen.getByText("no-error")).toBeInTheDocument();
    });

    expect(cartMedusaMocks.createCart).toHaveBeenCalledWith(null);
    expect(cartMedusaMocks.addCartLineItem).toHaveBeenNthCalledWith(
      1,
      "cart_cookie",
      "variant_vanilla",
      1,
    );
    expect(cartMedusaMocks.addCartLineItem).toHaveBeenNthCalledWith(
      2,
      "cart_replacement",
      "variant_vanilla",
      1,
    );
  });
});
