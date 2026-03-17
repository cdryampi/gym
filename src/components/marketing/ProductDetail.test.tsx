// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { vi } from "vitest";

import ProductDetail from "@/components/marketing/ProductDetail";
import type { Product } from "@/data/types";

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

const product: Product = {
  id: "prod-medusa",
  slug: "whey-nova-forza",
  name: "Nova Forza Isolate Whey Protein",
  eyebrow: "Suplemento de elite",
  category: "suplementos",
  short_description: "Proteina limpia para el dia a dia.",
  description: "Descripcion larga orientada a socios que entrenan fuerza.",
  price: 49.99,
  compare_price: 58.99,
  discount_label: "Ahorra 15%",
  currency: "EUR",
  stock_status: "in_stock",
  pickup_only: true,
  pickup_note: "Disponible en recepcion.",
  pickup_summary: "Recogida en Nova Forza Gym",
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
      currency: "EUR",
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
    render(<ProductDetail product={product} />);

    expect(
      screen.getByRole("heading", { name: "Nova Forza Isolate Whey Protein" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ahorra 15%")).toBeInTheDocument();
    expect(screen.getByText("Sabor")).toBeInTheDocument();
    expect(screen.getByText("Chocolate Suizo")).toBeInTheDocument();
    expect(screen.getByText("Recogida en Nova Forza Gym")).toBeInTheDocument();
    expect(screen.getByText("Beneficios")).toBeInTheDocument();
    expect(screen.getByText("Como usar")).toBeInTheDocument();
    expect(screen.getByText("Especificaciones")).toBeInTheDocument();
    expect(screen.getByText("Reservar para recogida")).toBeInTheDocument();
  });
});
