// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import StoreProductForm from "@/components/admin/StoreProductForm";
import type { StoreCategory } from "@/lib/data/store";

const saveStoreProductMock = vi.fn();

vi.mock("@/app/(admin)/dashboard/tienda/actions", () => ({
  saveStoreProduct: (...args: unknown[]) => saveStoreProductMock(...args),
}));

vi.mock("@/components/admin/ImageUpload", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string[];
    onChange: (value: string[]) => void;
  }) => (
    <textarea
      aria-label="Imagenes (una por linea)"
      value={value.join("\n")}
      onChange={(event) => onChange(event.target.value.split("\n").filter(Boolean))}
    />
  ),
}));

const categories: StoreCategory[] = [
  { id: "root-1", slug: "suplementos", name: "Suplementos", order: 1, active: true },
  { id: "child-1", slug: "proteinas", name: "Proteinas", parent_id: "root-1", order: 1, active: true },
];

describe("StoreProductForm", () => {
  beforeEach(() => {
    saveStoreProductMock.mockReset();
  });

  it("renders subcategory options from the taxonomy", () => {
    render(<StoreProductForm categories={categories} />);

    expect(screen.getByRole("option", { name: "— Suplementos / Proteinas" })).toBeInTheDocument();
  });

  it("submits the normalized product payload", async () => {
    saveStoreProductMock.mockResolvedValue("prod-1");
    const user = userEvent.setup();

    render(<StoreProductForm categories={categories} />);

    await user.type(screen.getByLabelText("Nombre"), "Whey Nova");
    await user.selectOptions(screen.getByLabelText("Subcategoria"), "child-1");
    await user.type(screen.getByLabelText("Descripcion corta"), "Descripcion corta valida");
    await user.type(
      screen.getByLabelText("Descripcion completa"),
      "Descripcion completa suficientemente larga para pasar validacion.",
    );
    await user.clear(screen.getByLabelText("Precio real"));
    await user.type(screen.getByLabelText("Precio real"), "49.99");
    await user.type(screen.getByLabelText("Precio estimado PayPal (USD)"), "13.95");
    await user.type(screen.getByLabelText("Imagenes (una por linea)"), "/img/whey.png");
    await user.clear(screen.getByLabelText("CTA"));
    await user.type(screen.getByLabelText("CTA"), "Reservar");
    await user.click(screen.getByRole("button", { name: /Guardar producto/i }));

    await waitFor(() => {
      expect(saveStoreProductMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Whey Nova",
          category_id: "child-1",
          paypal_price_usd: 13.95,
          cta_label: "Reservar",
        }),
        undefined,
      );
    });
  });
});
