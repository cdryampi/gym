// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { CartProvider, useCart } from "@/components/cart/CartProvider";
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
  const { cart, isReady } = useCart();

  return (
    <div>
      <span>{isReady ? "ready" : "loading"}</span>
      <span>{cart?.id ?? "no-cart"}</span>
      <span>{cart?.summary.itemCount ?? 0}</span>
      <span>{cart?.customerId ?? "guest"}</span>
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
    notes: "Pasare por la tarde.",
    status: "requested",
    currencyCode: "PEN",
    itemCount: 1,
    subtotal: 49.99,
    total: 49.99,
    lineItems: [],
    source: "gym-storefront",
    emailStatus: "sent",
    emailSentAt: "2026-03-22T12:00:00.000Z",
    emailError: null,
    createdAt: "2026-03-22T10:00:00.000Z",
    updatedAt: "2026-03-22T12:00:00.000Z",
  };
}

function CartPickupProbe() {
  const { cart, lastSubmittedPickupRequest, requestPickup } = useCart();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          void requestPickup("Pasare por la tarde.");
        }}
      >
        Enviar pickup
      </button>
      <span>{cart?.id ?? "no-cart"}</span>
      <span>{lastSubmittedPickupRequest?.requestNumber ?? "no-request"}</span>
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

    await user.click(screen.getByRole("button", { name: "Enviar pickup" }));

    await waitFor(() => {
      expect(screen.getByText("no-cart")).toBeInTheDocument();
      expect(screen.getByText("NF-20260322-ABC123")).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith("/api/cart/pickup-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cartId: "cart_cookie",
        notes: "Pasare por la tarde.",
      }),
    });
  });
});
