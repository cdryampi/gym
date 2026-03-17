// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { vi } from "vitest";

import StoreProductsTable from "@/components/admin/StoreProductsTable";
import { products as mockProducts } from "@/data/products";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("StoreProductsTable", () => {
  it("renders root and subcategory labels for product rows", () => {
    render(
      <StoreProductsTable
        products={[
          {
            ...mockProducts[0],
            category_id: "child-1",
            parent_category_name: "Suplementos",
            category_name: "Creatinas",
          },
        ]}
      />,
    );

    expect(screen.getByText("Creatina Monohidratada 300 g")).toBeInTheDocument();
    expect(screen.getByText("Suplementos / Creatinas")).toBeInTheDocument();
  });
});
