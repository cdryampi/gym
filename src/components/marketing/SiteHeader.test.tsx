// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import type { ComponentProps } from "react";
import { vi } from "vitest";

import SiteHeader from "@/components/marketing/SiteHeader";
import { defaultSiteSettings } from "@/lib/data/default-content";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: ComponentProps<"img"> & { fill?: boolean; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={typeof src === "string" ? src : undefined} />
  ),
}));

vi.mock("@/components/cart/CartEntry", () => ({
  default: () => <button type="button">Abrir carrito</button>,
}));

describe("SiteHeader", () => {
  it("shows public auth actions when there is no member session", () => {
    render(<SiteHeader settings={defaultSiteSettings} currentUser={null} />);

    const joinLinks = screen.getAllByRole("link", { name: /Unirme/i });

    expect(joinLinks).toHaveLength(2);
    joinLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/registro");
    });
    expect(screen.queryByRole("link", { name: "Mi cuenta" })).not.toBeInTheDocument();
  });

  it("shows the private account link when a member session exists", () => {
    render(
      <SiteHeader
        settings={defaultSiteSettings}
        currentUser={{ email: "socio@gym.com" } as User}
      />,
    );

    const accountLinks = screen.getAllByRole("link", { name: "Mi cuenta" });

    expect(accountLinks).toHaveLength(2);
    accountLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/mi-cuenta");
    });
    expect(screen.queryByRole("link", { name: /Unirme/i })).not.toBeInTheDocument();
  });
});
