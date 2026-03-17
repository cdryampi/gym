// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { vi } from "vitest";

import ProductCard from "@/components/marketing/ProductCard";
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
  slug: "creatina-monohidratada",
  name: "Creatina Monohidratada",
  eyebrow: "Base de rendimiento",
  category: "suplementos",
  short_description: "Soporte diario para fuerza y potencia.",
  description: "Descripcion larga de creatina.",
  price: 24.9,
  currency: "EUR",
  stock_status: "in_stock",
  pickup_only: true,
  featured: true,
  images: ["https://cdn.example.com/creatina.png"],
  tags: ["Fuerza", "Uso diario"],
  highlights: ["300 g"],
  cta_label: "Disponible en tienda",
  order: 1,
  active: true,
};

describe("ProductCard", () => {
  it("renders storefront catalogue content", () => {
    render(<ProductCard product={product} />);

    expect(screen.getByRole("link", { name: "Creatina Monohidratada" })).toHaveAttribute(
      "href",
      "/tienda/creatina-monohidratada",
    );
    expect(screen.getByText(/24,90/)).toBeInTheDocument();
    expect(screen.getAllByText("Premium").length).toBeGreaterThan(0);
    expect(screen.getByText("Ver mas")).toBeInTheDocument();
  });
});
