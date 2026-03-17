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
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt, ...props }: ComponentProps<"img">) => <img alt={alt} {...props} />,
}));

describe("SiteHeader", () => {
  it("shows public auth actions when there is no member session", () => {
    render(<SiteHeader settings={defaultSiteSettings} currentUser={null} />);

    expect(screen.getByRole("link", { name: /Unirme/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mi cuenta" })).not.toBeInTheDocument();
  });

  it("shows the private account link when a member session exists", () => {
    render(
      <SiteHeader
        settings={defaultSiteSettings}
        currentUser={{ email: "socio@gym.com" } as User}
      />,
    );

    expect(screen.getByRole("link", { name: "Mi cuenta" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Crear cuenta" })).not.toBeInTheDocument();
  });
});
