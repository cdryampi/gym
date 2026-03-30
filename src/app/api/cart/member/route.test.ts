import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GYM_CART_COOKIE } from "@/lib/cart/cookie";
import { STALE_CART_MESSAGE } from "@/lib/cart/runtime";

const memberRouteMocks = vi.hoisted(() => ({
  attachCartToMember: vi.fn(),
  revalidateMemberCommerceCustomer: vi.fn(),
  retrieveActiveCartForMember: vi.fn(),
  resolveCartIdFromRequest: vi.fn(),
  resolveOrCreateMemberCommerceCustomer: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  mapMedusaCart: vi.fn(),
  retrieveCart: vi.fn(),
}));

vi.mock("@/lib/cart/member-bridge", () => ({
  attachCartToMember: memberRouteMocks.attachCartToMember,
  revalidateMemberCommerceCustomer: memberRouteMocks.revalidateMemberCommerceCustomer,
  retrieveActiveCartForMember: memberRouteMocks.retrieveActiveCartForMember,
  resolveCartIdFromRequest: memberRouteMocks.resolveCartIdFromRequest,
  resolveOrCreateMemberCommerceCustomer: memberRouteMocks.resolveOrCreateMemberCommerceCustomer,
}));

vi.mock("@/lib/cart/medusa", () => ({
  mapMedusaCart: memberRouteMocks.mapMedusaCart,
  retrieveCart: memberRouteMocks.retrieveCart,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: memberRouteMocks.createSupabaseServerClient,
}));

import { POST } from "@/app/api/cart/member/route";

describe("POST /api/cart/member", () => {
  beforeEach(() => {
    memberRouteMocks.resolveCartIdFromRequest.mockResolvedValue("cart_01");
    memberRouteMocks.resolveOrCreateMemberCommerceCustomer.mockResolvedValue({
      medusa_customer_id: "cus_01",
      email: "socio@gym.com",
    });
    memberRouteMocks.revalidateMemberCommerceCustomer.mockResolvedValue({
      medusa_customer_id: "cus_02",
      email: "socio@gym.com",
    });
    memberRouteMocks.retrieveActiveCartForMember.mockResolvedValue({
      cart: null,
    });
    memberRouteMocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user_01",
              email: "socio@gym.com",
            },
          },
        }),
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the mapped cart when the member bridge succeeds", async () => {
    memberRouteMocks.attachCartToMember.mockResolvedValue({
      cart: {
        id: "cart_01",
      },
    });
    memberRouteMocks.mapMedusaCart.mockReturnValue({
      id: "cart_01",
      items: [],
      summary: { itemCount: 0 },
    });

    const response = await POST(
      new Request("http://localhost/api/cart/member", {
        method: "POST",
        body: JSON.stringify({
          cartId: "cart_01",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(memberRouteMocks.attachCartToMember).toHaveBeenCalledWith(
      "cart_01",
      "cus_01",
      "socio@gym.com",
    );
    expect(payload.cart.id).toBe("cart_01");
  });

  it("recovers the current active cart when the member session has no cart cookie", async () => {
    memberRouteMocks.resolveCartIdFromRequest.mockResolvedValue(null);
    memberRouteMocks.retrieveActiveCartForMember.mockResolvedValue({
      cart: {
        id: "cart_active_01",
      },
    });
    memberRouteMocks.mapMedusaCart.mockReturnValue({
      id: "cart_active_01",
      items: [],
      summary: { itemCount: 0 },
    });

    const response = await POST(
      new Request("http://localhost/api/cart/member", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(memberRouteMocks.retrieveActiveCartForMember).toHaveBeenCalledWith("cus_01");
    expect(payload.cart.id).toBe("cart_active_01");
  });

  it("degrades gracefully when active-cart recovery is not yet available in Medusa", async () => {
    memberRouteMocks.resolveCartIdFromRequest.mockResolvedValue(null);
    memberRouteMocks.retrieveActiveCartForMember.mockRejectedValue(
      new Error("No se pudo recuperar el carrito activo del socio: Not Found"),
    );

    const response = await POST(
      new Request("http://localhost/api/cart/member", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.customer.medusa_customer_id).toBe("cus_01");
    expect(payload.cart).toBeNull();
  });

  it("returns a stale-cart response when Medusa reports the cart as missing", async () => {
    memberRouteMocks.attachCartToMember.mockRejectedValue(
      new Error("No se pudo vincular el carrito a la cuenta del miembro: Not Found"),
    );
    memberRouteMocks.retrieveCart.mockRejectedValue(new Error("Cart with id cart_01 does not exist"));

    const response = await POST(
      new Request("http://localhost/api/cart/member", {
        method: "POST",
        body: JSON.stringify({
          cartId: "cart_01",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toBe(STALE_CART_MESSAGE);
    expect(response.headers.get("set-cookie")).toContain(`${GYM_CART_COOKIE}=`);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("re-resolves the Medusa customer and retries attach once when the stored bridge is stale", async () => {
    memberRouteMocks.attachCartToMember
      .mockRejectedValueOnce(
        new Error("No se pudo vincular el carrito a la cuenta del miembro: Not Found"),
      )
      .mockResolvedValueOnce({
        cart: {
          id: "cart_01",
        },
      });
    memberRouteMocks.mapMedusaCart.mockReturnValue({
      id: "cart_01",
      items: [],
      summary: { itemCount: 0 },
    });

    const response = await POST(
      new Request("http://localhost/api/cart/member", {
        method: "POST",
        body: JSON.stringify({
          cartId: "cart_01",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(memberRouteMocks.revalidateMemberCommerceCustomer).toHaveBeenCalledTimes(1);
    expect(memberRouteMocks.attachCartToMember).toHaveBeenNthCalledWith(
      1,
      "cart_01",
      "cus_01",
      "socio@gym.com",
    );
    expect(memberRouteMocks.attachCartToMember).toHaveBeenNthCalledWith(
      2,
      "cart_01",
      "cus_02",
      "socio@gym.com",
    );
    expect(payload.customer.medusa_customer_id).toBe("cus_02");
    expect(payload.cart.id).toBe("cart_01");
  });

  it("keeps the cart when attach fails but the cart can still be retrieved", async () => {
    memberRouteMocks.attachCartToMember
      .mockRejectedValueOnce(
        new Error("No se pudo vincular el carrito a la cuenta del miembro: Not Found"),
      )
      .mockRejectedValueOnce(
        new Error("No se pudo vincular el carrito a la cuenta del miembro: Not Found"),
      );
    memberRouteMocks.retrieveCart.mockResolvedValue({
      id: "cart_01",
      items: [],
      summary: { itemCount: 0 },
    });

    const response = await POST(
      new Request("http://localhost/api/cart/member", {
        method: "POST",
        body: JSON.stringify({
          cartId: "cart_01",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(memberRouteMocks.revalidateMemberCommerceCustomer).toHaveBeenCalledTimes(1);
    expect(memberRouteMocks.retrieveCart).toHaveBeenCalledWith("cart_01");
    expect(payload.customer.medusa_customer_id).toBe("cus_02");
    expect(payload.cart.id).toBe("cart_01");
  });
});
