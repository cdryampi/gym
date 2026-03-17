// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { vi } from "vitest";

import StoreCategoriesTable from "@/components/admin/StoreCategoriesTable";
import type { StoreCategoryNode } from "@/lib/data/store";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const categories: StoreCategoryNode[] = [
  {
    id: "root-1",
    slug: "suplementos",
    name: "Suplementos",
    order: 1,
    active: true,
    children: [
      {
        id: "child-1",
        slug: "proteinas",
        name: "Proteinas",
        parent_id: "root-1",
        order: 1,
        active: true,
        children: [],
      },
    ],
  },
];

describe("StoreCategoriesTable", () => {
  it("renders parent and child categories", () => {
    render(<StoreCategoriesTable categories={categories} />);

    expect(screen.getByText("Suplementos")).toBeInTheDocument();
    expect(screen.getByText("Proteinas")).toBeInTheDocument();
    expect(screen.getByText("Subcategoria")).toBeInTheDocument();
  });
});
