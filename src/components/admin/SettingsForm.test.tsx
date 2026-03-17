// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import SettingsForm from "@/components/admin/SettingsForm";
import { defaultSiteSettings } from "@/lib/data/default-content";

const saveSiteSettingsMock = vi.fn();

vi.mock("@/app/(admin)/dashboard/actions", () => ({
  saveSiteSettings: (...args: unknown[]) => saveSiteSettingsMock(...args),
}));

describe("SettingsForm", () => {
  beforeEach(() => {
    saveSiteSettingsMock.mockReset();
  });

  it("renders collapsible sections and lets the user expand hidden groups", async () => {
    const user = userEvent.setup();

    render(<SettingsForm settings={defaultSiteSettings} />);

    expect(screen.getByDisplayValue(defaultSiteSettings.site_name)).toBeInTheDocument();
    expect(screen.queryByLabelText("Título para Google")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /SEO/i }));

    expect(screen.getByLabelText("Título para Google")).toBeInTheDocument();
  });

  it("shows validation errors before saving invalid data", async () => {
    const user = userEvent.setup();

    render(<SettingsForm settings={defaultSiteSettings} />);

    await user.clear(screen.getByLabelText("Nombre del Gimnasio"));
    await user.click(screen.getByRole("button", { name: /Guardar ajustes avanzados/i }));

    expect(await screen.findByText("El nombre del sitio es obligatorio.")).toBeInTheDocument();
    expect(saveSiteSettingsMock).not.toHaveBeenCalled();
  });

  it("submits the normalized payload to the save action", async () => {
    saveSiteSettingsMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<SettingsForm settings={defaultSiteSettings} />);

    await user.click(screen.getByRole("button", { name: /Guardar ajustes avanzados/i }));

    await waitFor(() => {
      expect(saveSiteSettingsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          site_name: defaultSiteSettings.site_name,
          seo_og_image_url: "",
          footer_text: defaultSiteSettings.footer_text,
        }),
      );
    });
  });
});
