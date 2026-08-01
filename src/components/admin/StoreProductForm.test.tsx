// @vitest-environment jsdom

import type { ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import StoreProductForm from "@/components/admin/StoreProductForm";
import type { StoreCategory, StoreDashboardProduct } from "@/lib/data/store";

const saveStoreProductMock = vi.fn();
const clearDraftMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireAdminUser: vi.fn().mockResolvedValue({ id: "admin-1", email: "admin@test.com" }),
  getDashboardAccessState: vi.fn().mockResolvedValue({
    user: { id: "admin-1", email: "admin@test.com" },
    accessMode: "admin",
    accessWarning: null,
  }),
}));

vi.mock("@/app/(admin)/dashboard/tienda/actions", () => ({
  saveStoreProduct: (...args: unknown[]) => saveStoreProductMock(...args),
}));

vi.mock("@/hooks/admin/use-form-draft", () => ({
  useFormDraft: () => ({
    hasDraft: false,
    isSaving: false,
    saveDraft: vi.fn(),
    clearDraft: (...args: unknown[]) => clearDraftMock(...args),
    applyDraft: vi.fn(),
  }),
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

vi.mock("@/components/admin/ImageUpload", () => ({
  default: ({
    value,
    onChange,
    ...props
  }: {
    value: string[];
    onChange: (value: string[]) => void;
  }) => (
    <textarea
      {...props}
      aria-label="Imagenes del producto"
      value={value.join("\n")}
      onChange={(event) => onChange(event.target.value.split("\n").filter(Boolean))}
    />
  ),
}));

const categories: StoreCategory[] = [
  { id: "root-1", slug: "suplementos", name: "Suplementos", order: 1, active: true },
  {
    id: "child-1",
    slug: "proteinas",
    name: "Proteinas",
    parent_id: "root-1",
    order: 1,
    active: true,
  },
];

const existingProduct: StoreDashboardProduct = {
  id: "prod-1",
  slug: "whey-nova",
  name: "Whey Nova",
  eyebrow: "Suplemento premium",
  category: "suplementos",
  category_id: "child-1",
  short_description: "Proteina limpia para el dia a dia.",
  description: "Descripcion completa suficientemente larga para la ficha publica de producto.",
  price: 49.99,
  paypal_price_usd: 13.95,
  compare_price: 58.99,
  discount_label: "Promo",
  currency: "PEN",
  stock_status: "in_stock",
  pickup_only: true,
  pickup_note: "Disponible en recepcion",
  pickup_summary: "Recogida en club",
  pickup_eta: "Listo hoy",
  featured: true,
  images: ["/img/whey.png"],
  tags: ["Proteina", "Recuperacion"],
  highlights: ["24 g por toma"],
  benefits: ["Recuperacion muscular"],
  usage_steps: ["Mezcla una toma con agua"],
  specifications: [{ label: "Peso", value: "2 kg" }],
  options: [
    {
      id: "opt-1",
      title: "Sabor",
      values: ["Chocolate"],
    },
  ],
  variants: [
    {
      id: "variant-1",
      title: "Chocolate",
      inventory_quantity: 5,
      price: 49.99,
      currency: "PEN",
      options: [{ option_id: "opt-1", option_title: "Sabor", value: "Chocolate" }],
    },
  ],
  cta_label: "Reservar",
  order: 1,
  active: true,
};

describe("StoreProductForm", () => {
  beforeEach(() => {
    saveStoreProductMock.mockReset();
    clearDraftMock.mockReset();
  });

  it("renders subcategory options from the taxonomy", () => {
    render(<StoreProductForm categories={categories} />);

    expect(screen.getByRole("option", { name: /Suplementos \/ Proteinas/i })).toBeInTheDocument();
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
    await user.type(screen.getByLabelText("Referencia USD (PayPal)"), "13.95");
    await user.type(screen.getByLabelText("Imagenes del producto"), "/img/whey.png");
    await user.clear(screen.getByLabelText("CTA"));
    await user.type(screen.getByLabelText("CTA"), "Reservar");
    await user.click(screen.getByRole("button", { name: /Publicar/i }));

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

    expect(clearDraftMock).toHaveBeenCalled();
  }, 20000);

  it("renders the preview rail and switches between card and PDP modes", async () => {
    const user = userEvent.setup();

    render(<StoreProductForm categories={categories} product={existingProduct} />);

    expect(screen.getByText("Como se vera en tienda")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tarjeta/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /Ficha/i }));

    expect(screen.getByRole("button", { name: /Ficha/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Preview ficha PDP")).toBeInTheDocument();
  });

  it("keeps the storefront link disabled for a new draft product", () => {
    render(<StoreProductForm categories={categories} />);

    expect(screen.getByRole("button", { name: /Guarda para abrir la ficha real/i })).toBeDisabled();
    expect(
      screen.getByText("Todavia no hay ruta real en tienda para este borrador."),
    ).toBeInTheDocument();
  });

  it("enables the storefront link for an existing product", () => {
    render(<StoreProductForm categories={categories} product={existingProduct} />);

    const storefrontLink = screen.getByRole("link", { name: /Abrir en storefront/i });

    expect(storefrontLink).toHaveAttribute("href", "/tienda/whey-nova");
  });
});
