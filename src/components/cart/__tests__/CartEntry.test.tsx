// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { vi } from "vitest";

import CartEntry from "@/components/cart/CartEntry";
import type { Cart } from "@/lib/cart/types";

const cartProviderMocks = vi.hoisted(() => ({
  useCart: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/cart/CartProvider", () => ({
  useCart: cartProviderMocks.useCart,
}));

function buildCart(): Cart {
  return {
    id: "cart_01",
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
        quantity: 2,
        productId: "prod_01",
        productTitle: "Nova Whey",
        productHandle: "nova-whey",
        variantId: "variant_chocolate",
        variantTitle: "Chocolate",
        variantSku: null,
        unitPrice: 49.99,
        subtotal: 99.98,
        total: 99.98,
        currencyCode: "PEN",
        requiresShipping: false,
        selectedOptions: [{ optionTitle: "Sabor", value: "Chocolate" }],
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
  };
}

describe("CartEntry", () => {
  it("shows the mini-cart count and totals when the drawer is open", () => {
    cartProviderMocks.useCart.mockReturnValue({
      cart: buildCart(),
      lastSubmittedPickupRequest: null,
      pickupEmailWarning: null,
      error: null,
      isBusy: false,
      isDrawerOpen: true,
      setDrawerOpen: vi.fn(),
      clearSubmittedPickupRequest: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
    });

    render(<CartEntry />);

    expect(screen.getByRole("button", { name: "Abrir carrito", hidden: true })).toBeInTheDocument();
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(screen.getByText("Tu carrito")).toBeInTheDocument();
    expect(screen.getAllByText(/99\.98/)).not.toHaveLength(0);
    expect(screen.getByRole("link", { name: "Ver carrito completo" })).toHaveAttribute(
      "href",
      "/carrito",
    );
  });
});
