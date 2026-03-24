// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import CmsDocumentsForm from "@/components/admin/CmsDocumentsForm";
import { defaultCmsDocumentList } from "@/lib/data/default-cms";

const saveCmsDocumentMock = vi.fn();

vi.mock("@/app/(admin)/dashboard/actions", () => ({
  saveCmsDocument: (...args: unknown[]) => saveCmsDocumentMock(...args),
}));

describe("CmsDocumentsForm", () => {
  beforeEach(() => {
    saveCmsDocumentMock.mockReset();
  });

  it("renders legal and system document sections", () => {
    render(<CmsDocumentsForm documents={defaultCmsDocumentList} />);

    expect(screen.getByText("Legales")).toBeInTheDocument();
    expect(screen.getAllByText("Sistema").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("Politica de privacidad")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Cookies y preferencias del sitio")).toBeInTheDocument();
  });

  it("submits the edited CMS document", async () => {
    const user = userEvent.setup();
    saveCmsDocumentMock.mockResolvedValue(undefined);

    render(<CmsDocumentsForm documents={defaultCmsDocumentList.slice(0, 1)} />);

    const titleInput = screen.getByLabelText("Titulo");
    await user.clear(titleInput);
    await user.type(titleInput, "Politica de privacidad actualizada");
    await user.click(screen.getByRole("button", { name: "Guardar documento" }));

    await waitFor(() => {
      expect(saveCmsDocumentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          key: "legal-privacy",
          title: "Politica de privacidad actualizada",
        }),
      );
    });
  });
});
