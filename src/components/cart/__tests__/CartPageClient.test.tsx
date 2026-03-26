// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { vi } from "vitest";

import CartPageClient from "@/components/cart/CartPageClient";
import type { Cart } from "@/lib/cart/types";

const cartProviderMocks = vi.hoisted(() => ({
  useCart: vi.fn(),
}));

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
}));

vi.mock("@/components/cart/CartProvider", () => ({
  useCart: cartProviderMocks.useCart,
}));

vi.mock("@/components/cart/PayPalCheckoutButton", () => ({
  default: ({
    onApproveCheckout,
  }: {
    onApproveCheckout: () => Promise<void>;
  }) => (
    <button
      type="button"
      onClick={() => {
        void onApproveCheckout();
      }}
    >
      Mock PayPal
    </button>
  ),
}));

function buildCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: "cart_01",
    email: null,
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
    ...overrides,
  };
}

describe("CartPageClient", () => {
  beforeEach(() => {
    navigationMocks.push.mockReset();
    vi.stubEnv("NEXT_PUBLIC_PAYPAL_CLIENT_ID", "paypal_client_test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the cart quantities and totals with the PayPal preparation CTA", () => {
    cartProviderMocks.useCart.mockReturnValue({
      cart: buildCart(),
      lastSubmittedPickupRequest: null,
      pickupEmailWarning: null,
      notice: null,
      error: null,
      isReady: true,
      isBusy: false,
      memberEmail: null,
      clearSubmittedPickupRequest: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
      saveEmail: vi.fn(),
      preparePayPalCheckout: vi.fn(),
      completePayPalCheckout: vi.fn(),
    });

    render(<CartPageClient />);

    expect(
      screen.getByRole("heading", { name: /Tu seleccion para recoger en el club/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nova Whey")).toBeInTheDocument();
    expect(screen.getAllByText(/99\.98/)).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Preparar pago con PayPal" })).toBeInTheDocument();
  });

  it("explains the PEN display and USD PayPal charge before preparing checkout", () => {
    cartProviderMocks.useCart.mockReturnValue({
      cart: buildCart(),
      lastSubmittedPickupRequest: null,
      pickupEmailWarning: null,
      notice: null,
      error: null,
      isReady: true,
      isBusy: false,
      memberEmail: null,
      clearSubmittedPickupRequest: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
      saveEmail: vi.fn(),
      preparePayPalCheckout: vi.fn(),
      completePayPalCheckout: vi.fn(),
    });

    render(<CartPageClient />);

    expect(
      screen.getByText(/Los precios de tienda se mantienen en PEN/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preparar pago con PayPal" })).toBeInTheDocument();
  });

  it("saves the guest email before preparing the PayPal checkout", async () => {
    const saveEmailMock = vi.fn().mockResolvedValue(undefined);
    const preparePayPalCheckoutMock = vi.fn().mockResolvedValue(buildCart());
    const user = userEvent.setup();

    cartProviderMocks.useCart.mockReturnValue({
      cart: buildCart(),
      lastSubmittedPickupRequest: null,
      pickupEmailWarning: null,
      notice: null,
      error: null,
      isReady: true,
      isBusy: false,
      memberEmail: null,
      clearSubmittedPickupRequest: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
      saveEmail: saveEmailMock,
      preparePayPalCheckout: preparePayPalCheckoutMock,
      completePayPalCheckout: vi.fn(),
    });

    render(<CartPageClient />);

    await user.type(screen.getByPlaceholderText("tu@email.com"), "Socio@Gym.com");
    await user.type(
      screen.getByPlaceholderText(/pasaré por recepción/i),
      "Pasaré por la tarde.",
    );
    await user.click(screen.getByRole("button", { name: "Preparar pago con PayPal" }));

    await waitFor(() => {
      expect(saveEmailMock).toHaveBeenCalledWith("socio@gym.com");
      expect(preparePayPalCheckoutMock).toHaveBeenCalledWith({
        email: "socio@gym.com",
        notes: "Pasaré por la tarde.",
      });
    });
  });

  it("opens the dedicated PayPal checkout panel when the session is ready and redirects after approval", async () => {
    const completePayPalCheckoutMock = vi.fn().mockResolvedValue({
      id: "pick_01",
    });
    const user = userEvent.setup();

    cartProviderMocks.useCart.mockReturnValue({
      cart: buildCart({
        paymentSession: {
          id: "pay_sess_01",
          providerId: "pp_paypal_paypal",
          status: "pending",
          amount: 29.6,
          currencyCode: "USD",
          displayAmount: 99.98,
          displayCurrencyCode: "PEN",
          exchangeRate: null,
          exchangeRateSource: null,
          exchangeRateReference: null,
          orderId: "paypal_order_01",
          authorizationId: null,
          captureId: null,
          data: {
            order_id: "paypal_order_01",
          },
        },
      }),
      lastSubmittedPickupRequest: null,
      pickupEmailWarning: null,
      notice: null,
      error: null,
      isReady: true,
      isBusy: false,
      memberEmail: null,
      clearSubmittedPickupRequest: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
      saveEmail: vi.fn(),
      preparePayPalCheckout: vi.fn(),
      completePayPalCheckout: completePayPalCheckoutMock,
    });

    render(<CartPageClient />);

    expect(screen.getByText(/Importe a Pagar \(USD\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(/PayPal procesará el cobro en USD siguiendo el importe estimado por producto/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Abrir checkout seguro de PayPal" }));

    expect(
      screen.getByRole("heading", { name: "Confirma tu pago con PayPal" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mock PayPal" }));

    await waitFor(() => {
      expect(completePayPalCheckoutMock).toHaveBeenCalledWith({
        email: undefined,
        notes: undefined,
      });
      expect(navigationMocks.push).toHaveBeenCalledWith("/carrito/confirmacion/pick_01");
    });
  });

  it("closes the PayPal dialog and shows a friendly notice when checkout is processing", async () => {
    const completePayPalCheckoutMock = vi.fn().mockResolvedValue("processing");
    const user = userEvent.setup();

    cartProviderMocks.useCart.mockReturnValue({
      cart: buildCart({
        paymentSession: {
          id: "pay_sess_01",
          providerId: "pp_paypal_paypal",
          status: "pending",
          amount: 29.6,
          currencyCode: "USD",
          displayAmount: 99.98,
          displayCurrencyCode: "PEN",
          exchangeRate: null,
          exchangeRateSource: null,
          exchangeRateReference: null,
          orderId: "paypal_order_01",
          authorizationId: null,
          captureId: null,
          data: {
            order_id: "paypal_order_01",
          },
        },
      }),
      lastSubmittedPickupRequest: null,
      pickupEmailWarning: null,
      notice: "PayPal ya ha confirmado tu pago.",
      error: null,
      isReady: true,
      isBusy: false,
      memberEmail: null,
      clearSubmittedPickupRequest: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
      saveEmail: vi.fn(),
      preparePayPalCheckout: vi.fn(),
      completePayPalCheckout: completePayPalCheckoutMock,
    });

    render(<CartPageClient />);

    await user.click(screen.getByRole("button", { name: "Abrir checkout seguro de PayPal" }));
    await user.click(screen.getByRole("button", { name: "Mock PayPal" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Pago recibido por PayPal\. Estamos terminando de confirmar tu pedido/i),
      ).toBeInTheDocument();
    });

    expect(navigationMocks.push).not.toHaveBeenCalled();
  });

  it("keeps the generic PayPal preparation flow even if the display currency changes", () => {
    cartProviderMocks.useCart.mockReturnValue({
      cart: buildCart({
        summary: {
          ...buildCart().summary,
          currencyCode: "ARS",
        },
        items: buildCart().items.map((item) => ({
          ...item,
          currencyCode: "ARS",
        })),
      }),
      lastSubmittedPickupRequest: null,
      pickupEmailWarning: null,
      notice: null,
      error: null,
      isReady: true,
      isBusy: false,
      memberEmail: null,
      clearSubmittedPickupRequest: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
      saveEmail: vi.fn(),
      preparePayPalCheckout: vi.fn(),
      completePayPalCheckout: vi.fn(),
    });

    render(<CartPageClient />);

    expect(screen.getByRole("button", { name: "Preparar pago con PayPal" })).toBeInTheDocument();
  });
});
