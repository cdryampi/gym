// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";

import StoreCatalogTable from "@/components/admin/StoreCatalogTable";
import { products as mockProducts } from "@/data/products";

describe("StoreCatalogTable", () => {
  it("renders the operational product rows with price and asset count", () => {
    render(<StoreCatalogTable products={mockProducts.slice(0, 2)} />);

    expect(screen.getByText("Creatina Monohidratada 300 g")).toBeInTheDocument();
    expect(screen.getByText("Nova Forza Isolate Whey Protein")).toBeInTheDocument();
    expect(screen.getAllByText("Assets").length).toBeGreaterThan(0);
    // Adjusting to 1 as we now have single premium assets per product
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
  });

  it("renders an empty state when there are no products", () => {
    render(<StoreCatalogTable products={[]} />);

    expect(screen.getByText("No hay productos visibles.")).toBeInTheDocument();
  });
});
