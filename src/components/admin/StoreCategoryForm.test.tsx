// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import StoreCategoryForm from "@/components/admin/StoreCategoryForm";

const saveStoreCategoryMock = vi.fn();

vi.mock("@/app/(admin)/dashboard/tienda/actions", () => ({
  saveStoreCategory: (...args: unknown[]) => saveStoreCategoryMock(...args),
}));

describe("StoreCategoryForm", () => {
  beforeEach(() => {
    saveStoreCategoryMock.mockReset();
  });

  it("shows validation errors before saving invalid data", async () => {
    const user = userEvent.setup();

    render(<StoreCategoryForm categories={[]} />);

    await user.click(screen.getByRole("button", { name: /Guardar categoria/i }));

    expect(await screen.findByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(saveStoreCategoryMock).not.toHaveBeenCalled();
  });

  it("submits the category payload to the save action", async () => {
    saveStoreCategoryMock.mockResolvedValue("cat-1");
    const user = userEvent.setup();

    render(<StoreCategoryForm categories={[]} />);

    await user.type(screen.getByLabelText("Nombre"), "Proteinas");
    await user.click(screen.getByRole("button", { name: /Guardar categoria/i }));

    await waitFor(() => {
      expect(saveStoreCategoryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Proteinas",
          active: true,
        }),
        undefined,
      );
    });
  });
});
