// @vitest-environment jsdom

import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import DashboardSidebar from "@/components/admin/DashboardSidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/tienda",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("DashboardSidebar", () => {
  it("renders the admin links and marks the current route", () => {
    render(<DashboardSidebar />);

    expect(screen.getByText("Nova Forza")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Inicio/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tienda/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Diseno Web/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ajustes Internos/i })).toBeInTheDocument();
  });
});
