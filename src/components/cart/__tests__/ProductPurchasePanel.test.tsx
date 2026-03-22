// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import ProductPurchasePanel from "@/components/cart/ProductPurchasePanel";
import type { Product } from "@/data/types";

const cartProviderMocks = vi.hoisted(() => ({
  useCart: vi.fn(),
}));

vi.mock("@/components/cart/CartProvider", () => ({
  useCart: cartProviderMocks.useCart,
}));

function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod_01",
    slug: "nova-whey",
    name: "Nova Whey",
    category: "suplementos",
    short_description: "Proteina premium",
    description: "Descripcion larga del producto",
    price: 49.99,
    currency: "PEN",
    stock_status: "in_stock",
    pickup_only: true,
    featured: true,
    images: ["/images/products/nova-whey.png"],
    tags: ["Proteina"],
    highlights: ["24 g de proteina"],
    cta_label: "Reservar",
    order: 1,
    active: true,
    options: [
      {
        id: "opt_sabor",
        title: "Sabor",
        values: ["Chocolate", "Vanilla"],
      },
    ],
    variants: [
      {
        id: "variant_chocolate",
        title: "Chocolate",
        inventory_quantity: 5,
        price: 49.99,
        currency: "PEN",
        options: [{ option_id: "opt_sabor", option_title: "Sabor", value: "Chocolate" }],
      },
      {
        id: "variant_vanilla",
        title: "Vanilla",
        inventory_quantity: 4,
        price: 49.99,
        currency: "PEN",
        options: [{ option_id: "opt_sabor", option_title: "Sabor", value: "Vanilla" }],
      },
    ],
    ...overrides,
  };
}

describe("ProductPurchasePanel", () => {
  it("blocks add to cart until a valid variant is selected when multiple variants exist", async () => {
    cartProviderMocks.useCart.mockReturnValue({
      addItem: vi.fn(),
      isBusy: false,
      error: null,
    });

    render(<ProductPurchasePanel product={buildProduct()} />);

    expect(screen.getByRole("button", { name: "Anadir al carrito" })).toBeDisabled();
  });

  it("adds the selected variant and quantity to the cart", async () => {
    const addItemMock = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    cartProviderMocks.useCart.mockReturnValue({
      addItem: addItemMock,
      isBusy: false,
      error: null,
    });

    render(<ProductPurchasePanel product={buildProduct()} />);

    await user.click(screen.getByRole("button", { name: "Vanilla" }));
    await user.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    await user.click(screen.getByRole("button", { name: "Anadir al carrito" }));

    expect(addItemMock).toHaveBeenCalledWith({
      variantId: "variant_vanilla",
      quantity: 2,
    });
  });
});
