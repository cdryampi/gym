// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CartProcessingPageClient from "@/components/cart/CartProcessingPageClient";

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
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

describe("CartProcessingPageClient", () => {
  beforeEach(() => {
    navigationMocks.replace.mockReset();
    vi.restoreAllMocks();
  });

  it("redirects to confirmation when the pickup request is ready", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ready",
          pickupRequestId: "pick_01",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    render(<CartProcessingPageClient cartId="cart_01" />);

    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenCalledWith("/carrito/confirmacion/pick_01");
    });
  });

  it("shows a manual review state when the backend asks to stop polling", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "pending_manual_review",
          message: "Revision manual activa.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    render(<CartProcessingPageClient cartId="cart_01" />);

    expect(
      await screen.findByRole("heading", { name: /Estamos revisando tu pago manualmente/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Revision manual")).toBeInTheDocument();
    expect(screen.getByText(/Revision manual activa/i)).toBeInTheDocument();
  });

  it("shows an explicit error state and allows checking again without repaying", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "error",
            message: "No hemos podido confirmar el pedido.",
            detail: "Medusa timeout",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "processing",
            message: "Seguimos sincronizando.",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );
    const user = userEvent.setup();

    render(<CartProcessingPageClient cartId="cart_01" />);

    expect(
      await screen.findByRole("heading", {
        name: /No hemos podido confirmar tu pedido desde la web/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Detalle tecnico: Medusa timeout/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Comprobar estado ahora" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Estamos registrando tu pedido pickup/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/Seguimos sincronizando/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
