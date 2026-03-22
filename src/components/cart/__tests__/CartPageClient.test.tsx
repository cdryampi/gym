// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { vi } from "vitest";

import CartPageClient from "@/components/cart/CartPageClient";
import type { Cart, PickupRequestDetail } from "@/lib/cart/types";

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

function buildCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: "cart_01",
    email: null,
    customerId: null,
    regionId: "reg_test",
    completedAt: null,
    metadata: null,
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
    ...overrides,
  };
}

function buildPickupRequest(): PickupRequestDetail {
  return {
    id: "pick_01",
    requestNumber: "NF-20260322-ABC123",
    cartId: "cart_01",
    customerId: null,
    supabaseUserId: null,
    email: "guest@gym.com",
    notes: "Pasare por la tarde.",
    status: "requested",
    currencyCode: "PEN",
    itemCount: 2,
    subtotal: 99.98,
    total: 99.98,
    lineItems: [],
    source: "gym-storefront",
    emailStatus: "failed",
    emailSentAt: null,
    emailError: "Resend timeout",
    createdAt: "2026-03-22T10:00:00.000Z",
    updatedAt: "2026-03-22T10:00:00.000Z",
  };
}

describe("CartPageClient", () => {
  it("renders the cart quantities and subtotals on the full cart page", () => {
    cartProviderMocks.useCart.mockReturnValue({
      cart: buildCart(),
      lastSubmittedPickupRequest: null,
      pickupEmailWarning: null,
      error: null,
      isReady: true,
      isBusy: false,
      memberEmail: null,
      clearSubmittedPickupRequest: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
      saveEmail: vi.fn(),
      requestPickup: vi.fn(),
    });

    render(<CartPageClient />);

    expect(screen.getByRole("heading", { name: /Tu seleccion para recoger en el club/i })).toBeInTheDocument();
    expect(screen.getByText("Nova Whey")).toBeInTheDocument();
    expect(screen.getAllByText(/99\.98/)).toHaveLength(3);
    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("tu@email.com")).toBeInTheDocument();
  });

  it("saves the guest email before requesting pickup", async () => {
    const saveEmailMock = vi.fn().mockResolvedValue(undefined);
    const requestPickupMock = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    cartProviderMocks.useCart.mockReturnValue({
      cart: buildCart(),
      lastSubmittedPickupRequest: null,
      pickupEmailWarning: null,
      error: null,
      isReady: true,
      isBusy: false,
      memberEmail: null,
      clearSubmittedPickupRequest: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
      saveEmail: saveEmailMock,
      requestPickup: requestPickupMock,
    });

    render(<CartPageClient />);

    await user.type(screen.getByPlaceholderText("tu@email.com"), "Socio@Gym.com");
    await user.type(
      screen.getByPlaceholderText(/pasare por recepcion/i),
      "Pasare por la tarde.",
    );
    await user.click(screen.getByRole("button", { name: "Solicitar recogida" }));

    await waitFor(() => {
      expect(saveEmailMock).toHaveBeenCalledWith("socio@gym.com");
      expect(requestPickupMock).toHaveBeenCalledWith("Pasare por la tarde.");
    });
  });

  it("shows the success state after submitting a pickup request", () => {
    cartProviderMocks.useCart.mockReturnValue({
      cart: null,
      lastSubmittedPickupRequest: buildPickupRequest(),
      pickupEmailWarning: "Resend timeout",
      error: null,
      isReady: true,
      isBusy: false,
      memberEmail: null,
      clearSubmittedPickupRequest: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
      saveEmail: vi.fn(),
      requestPickup: vi.fn(),
    });

    render(<CartPageClient />);

    expect(screen.getByText(/NF-20260322-ABC123/)).toBeInTheDocument();
    expect(screen.getByText(/La solicitud se guardo correctamente/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear un pedido nuevo" })).toHaveAttribute(
      "href",
      "/tienda",
    );
  });
});
