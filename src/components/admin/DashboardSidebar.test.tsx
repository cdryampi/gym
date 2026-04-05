// @vitest-environment jsdom

import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import DashboardSidebar from "@/components/admin/DashboardSidebar";

const pathnameMock = vi.hoisted(() => ({ current: "/dashboard/mobile" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.current,
}));

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

describe("DashboardSidebar", () => {
  it("renders ROUTINE DESIGNER as a child link under MOBILE HUB", () => {
    pathnameMock.current = "/dashboard/mobile";
    render(<DashboardSidebar />);

    const nav = screen.getByRole("navigation");
    const topLevelLabels = Array.from(nav.children).map((group) =>
      group.querySelector(":scope > a")?.textContent?.trim(),
    );

    expect(screen.getByTestId("mock-image")).toHaveAttribute("data-alt", "Nuova Forza Logo");
    expect(screen.getByRole("link", { name: /MOBILE HUB/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ROUTINE DESIGNER/i })).toBeInTheDocument();
    expect(topLevelLabels).toContain("MOBILE HUB");
    expect(topLevelLabels).not.toContain("ROUTINE DESIGNER");
    expect(screen.getByRole("link", { name: /COMMAND CENTER/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /RETAIL CONSOLE/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /CAMPAIGNS/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /IDENTITY STUDIO/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /KERNEL ARGS/i })).toBeInTheDocument();
  });

  it("marks MOBILE HUB as active on its own route", () => {
    pathnameMock.current = "/dashboard/mobile";
    render(<DashboardSidebar />);

    expect(screen.getByRole("link", { name: /MOBILE HUB/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /ROUTINE DESIGNER/i })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks MOBILE HUB and ROUTINE DESIGNER as active on routine routes", () => {
    pathnameMock.current = "/dashboard/rutinas/nueva";
    render(<DashboardSidebar />);

    expect(screen.getByRole("link", { name: /MOBILE HUB/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /ROUTINE DESIGNER/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
