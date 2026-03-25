import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GYM_CART_COOKIE } from "@/lib/cart/cookie";
import { STALE_CART_MESSAGE } from "@/lib/cart/runtime";

const memberRouteMocks = vi.hoisted(() => ({
  attachCartToMember: vi.fn(),
  resolveCartIdFromRequest: vi.fn(),
  resolveOrCreateMemberCommerceCustomer: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  mapMedusaCart: vi.fn(),
}));

vi.mock("@/lib/cart/member-bridge", () => ({
  attachCartToMember: memberRouteMocks.attachCartToMember,
  resolveCartIdFromRequest: memberRouteMocks.resolveCartIdFromRequest,
  resolveOrCreateMemberCommerceCustomer: memberRouteMocks.resolveOrCreateMemberCommerceCustomer,
}));

vi.mock("@/lib/cart/medusa", () => ({
  mapMedusaCart: memberRouteMocks.mapMedusaCart,
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

  it("returns a stale-cart response when Medusa reports the cart as missing", async () => {
    memberRouteMocks.attachCartToMember.mockRejectedValue(
      new Error("No se pudo vincular el carrito a la cuenta del miembro: Not Found"),
    );

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
});
