// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";

import FloatingWhatsAppButton from "@/components/marketing/FloatingWhatsAppButton";
import { defaultSiteSettings } from "@/lib/data/default-content";

describe("FloatingWhatsAppButton", () => {
  it("renders the floating WhatsApp link when a whatsapp url exists", () => {
    render(<FloatingWhatsAppButton settings={defaultSiteSettings} />);

    expect(
      screen.getByRole("link", {
        name: /escribenos por whatsapp/i,
      }),
    ).toHaveAttribute("href", defaultSiteSettings.whatsapp_url);

    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
  });

  it("does not render when whatsapp url is empty", () => {
    render(
      <FloatingWhatsAppButton
        settings={{
          ...defaultSiteSettings,
          whatsapp_url: "",
        }}
      />,
    );

    expect(
      screen.queryByRole("link", {
        name: /escribenos por whatsapp/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("does not render when whatsapp url is null", () => {
    render(
      <FloatingWhatsAppButton
        settings={{
          ...defaultSiteSettings,
          whatsapp_url: null,
        }}
      />,
    );

    expect(
      screen.queryByRole("link", {
        name: /escribenos por whatsapp/i,
      }),
    ).not.toBeInTheDocument();
  });
});
