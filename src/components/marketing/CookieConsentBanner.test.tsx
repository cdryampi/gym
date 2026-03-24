// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CookieConsentBanner from "@/components/marketing/CookieConsentBanner";
import { getDefaultCmsDocument } from "@/lib/data/default-cms";

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    document.cookie = "gym_cookie_consent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  it("renders the banner until the user accepts cookies", async () => {
    const user = userEvent.setup();

    render(<CookieConsentBanner document={getDefaultCmsDocument("system-cookie-banner")} />);

    expect(screen.getByText("Cookies y preferencias del sitio")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Aceptar" }));

    expect(screen.queryByText("Cookies y preferencias del sitio")).not.toBeInTheDocument();
    expect(document.cookie).toContain("gym_cookie_consent=accepted");
  });

  it("stores the rejection decision locally", async () => {
    const user = userEvent.setup();

    render(<CookieConsentBanner document={getDefaultCmsDocument("system-cookie-banner")} />);

    await user.click(screen.getByRole("button", { name: "Rechazar" }));

    expect(document.cookie).toContain("gym_cookie_consent=rejected");
  });
});
