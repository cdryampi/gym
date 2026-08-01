import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addCartLineItem: vi.fn(),
  createCart: vi.fn(),
  deleteCartLineItem: vi.fn(),
  retrieveCart: vi.fn(),
  updateCartEmail: vi.fn(),
  updateCartLineItem: vi.fn(),
}));

vi.mock("@/lib/cart/medusa", () => mocks);

import { GET, POST } from "./route";

function post(body: unknown) {
  return POST(
    new Request("https://nuovaforzagym.com/api/cart/store", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        host: "nuovaforzagym.com",
        origin: "https://nuovaforzagym.com",
      },
    }),
  );
}

describe("cart store route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects cross-origin cart mutations", async () => {
    const response = await POST(
      new Request("https://nuovaforzagym.com/api/cart/store", {
        method: "POST",
        body: JSON.stringify({ action: "create" }),
        headers: { host: "nuovaforzagym.com", origin: "https://attacker.example" },
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.createCart).not.toHaveBeenCalled();
  });

  it("creates and updates cart state through the Medusa adapter", async () => {
    mocks.createCart.mockResolvedValue({ id: "cart_1" });
    mocks.addCartLineItem.mockResolvedValue({ id: "cart_1", items: ["item_1"] });
    mocks.updateCartLineItem.mockResolvedValue({ id: "cart_1", quantity: 2 });
    mocks.deleteCartLineItem.mockResolvedValue({ id: "cart_1", items: [] });
    mocks.updateCartEmail.mockResolvedValue({ id: "cart_1", email: "qa@example.com" });

    expect((await post({ action: "create", email: "qa@example.com" })).status).toBe(200);
    expect((await post({ action: "add-item", cartId: "cart_1", variantId: "var_1", quantity: 1 })).status).toBe(200);
    expect((await post({ action: "update-item", cartId: "cart_1", lineItemId: "item_1", quantity: 2 })).status).toBe(200);
    expect((await post({ action: "delete-item", cartId: "cart_1", lineItemId: "item_1" })).status).toBe(200);
    expect((await post({ action: "update-email", cartId: "cart_1", email: "qa@example.com" })).status).toBe(200);
  });

  it("validates GET and mutation failures", async () => {
    expect((await GET(new Request("https://nuovaforzagym.com/api/cart/store"))).status).toBe(400);
    expect((await post({ action: "unknown" })).status).toBe(400);

    mocks.retrieveCart.mockRejectedValue(new Error("Medusa unavailable"));
    const response = await GET(
      new Request("https://nuovaforzagym.com/api/cart/store?cartId=cart_1"),
    );
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Medusa unavailable" });
  });
});
