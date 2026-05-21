// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { vi } from "vitest";

import ProductDetail from "@/components/marketing/ProductDetail";
import type { Product } from "@/data/types";
import { CartProvider } from "@/features/checkout";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: ComponentProps<"img"> & { fill?: boolean }) => (
    <div data-testid="mock-image" data-alt={alt} />
  ),
}));

vi.mock("@/features/checkout", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/checkout")>();
  return {
    ...original,
    ProductPurchasePanel: ({ previewMode }: { previewMode?: boolean }) => (
      <div>{previewMode ? "Reserva disponible en storefront" : "Añadir a la reserva"}</div>
    ),
  };
});

const product: Product = {
  id: "prod-medusa",
  slug: "whey-nova-forza",
  name: "Nuova Forza Isolate Whey Protein",
  eyebrow: "Suplemento de elite",
  category: "suplementos",
  short_description: "Proteina limpia para el dia a dia.",
  description: "Descripcion larga orientada a socios que entrenan fuerza.",
  price: 49.99,
  paypal_price_usd: 13.95,
  compare_price: 58.99,
  discount_label: "Ahorra 15%",
  currency: "PEN",
  stock_status: "in_stock",
  pickup_only: true,
  pickup_note: "Disponible en recepcion.",
  pickup_summary: "Recogida en Nuova Forza Gym",
  pickup_eta: "Tu producto estara listo en menos de 24 horas laborables.",
  featured: true,
  images: ["https://cdn.example.com/whey.png", "https://cdn.example.com/whey-side.png"],
  tags: ["Proteina", "Recuperacion"],
  highlights: ["24 g de proteina por toma"],
  benefits: ["Sintesis muscular acelerada."],
  usage_steps: ["Mezcla una toma con agua fria."],
  specifications: [{ label: "Peso neto", value: "2 kg / 4.4 lbs" }],
  options: [
    {
      id: "opt-1",
      title: "Sabor",
      values: ["Chocolate Suizo", "Vanilla Bourbon"],
    },
  ],
  variants: [
    {
      id: "variant-1",
      title: "Chocolate Suizo",
      sku: "WHEY-CHOCO",
      inventory_quantity: 8,
      price: 49.99,
      currency: "PEN",
      options: [
        {
          option_id: "opt-1",
          option_title: "Sabor",
          value: "Chocolate Suizo",
        },
      ],
    },
  ],
  cta_label: "Reservar para recogida",
  order: 1,
  active: true,
};

describe("ProductDetail", () => {
  it("renders the storefront PDP sections driven by product data", () => {
    render(
      <CartProvider>
        <ProductDetail product={product} />
      </CartProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Nuova Forza Isolate Whey Protein" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ahorra 15%")).toBeInTheDocument();
    expect(screen.getByText(/Reserva asistida con cierre manual desde WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByText(/Recogida en Nuova Forza Gym/i)).toBeInTheDocument();
    expect(screen.getByText("Beneficios")).toBeInTheDocument();
    expect(screen.getByText("Como usar")).toBeInTheDocument();
    expect(screen.getByText("Especificaciones")).toBeInTheDocument();
    expect(screen.getByText("Añadir a la reserva")).toBeInTheDocument();
  });

  it("switches to preview mode without rendering the live purchase CTA", () => {
    render(
      <CartProvider>
        <ProductDetail product={product} previewMode />
      </CartProvider>,
    );

    expect(screen.getByText("Preview ficha PDP")).toBeInTheDocument();
    expect(screen.getByText("Reserva disponible en storefront")).toBeInTheDocument();
    expect(screen.queryByText("Añadir a la reserva")).not.toBeInTheDocument();
  });
});
