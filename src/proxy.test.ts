import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const proxyMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getServerSupabaseEnv: vi.fn(),
  hasSupabaseServiceRole: vi.fn(),
  verifyFirebaseSessionToken: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: proxyMocks.createClient,
}));

vi.mock("@/lib/env", () => ({
  getServerSupabaseEnv: proxyMocks.getServerSupabaseEnv,
  hasSupabaseServiceRole: proxyMocks.hasSupabaseServiceRole,
  hasLocalAdminEnv: vi.fn().mockReturnValue(false),
}));

vi.mock("@/lib/firebase/server", () => ({
  verifyFirebaseSessionToken: proxyMocks.verifyFirebaseSessionToken,
}));

async function importProxyModule() {
  vi.resetModules();
  return import("./proxy");
}

function createFirebaseSessionCookie(userId: string) {
  return "valid-token-" + userId;
}

function createSupabaseProxyClient(input: {
  isModuleEnabled: boolean;
  isSuperadmin: boolean;
}) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: (_column: string, value: string) => {
          if (table === "system_modules") {
            return {
              maybeSingle: async () => ({
                data: { is_enabled: input.isModuleEnabled, name: value },
                error: null,
              }),
            };
          }

          return {
            eq: () => ({
              maybeSingle: async () => ({
                data: input.isSuperadmin ? { role: "superadmin" } : null,
                error: null,
              }),
            }),
          };
        },
      }),
    }),
  };
}

describe("proxy security hardening", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    proxyMocks.createClient.mockReset();
    proxyMocks.getServerSupabaseEnv.mockReset();
    proxyMocks.hasSupabaseServiceRole.mockReset();
    proxyMocks.verifyFirebaseSessionToken.mockReset();
    
    proxyMocks.getServerSupabaseEnv.mockReturnValue({
      url: "https://supabase.test",
      serviceRoleKey: "service-role",
    });
    proxyMocks.hasSupabaseServiceRole.mockReturnValue(true);
    proxyMocks.verifyFirebaseSessionToken.mockImplementation(async (token) => {
      if (token.startsWith("valid-token-")) {
        return { uid: token.replace("valid-token-", "") };
      }
      throw new Error("Invalid token");
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redirects to login when no session is present on admin route", async () => {
    const { proxy } = await importProxyModule();
    const response = await proxy(new NextRequest("http://localhost/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(response.headers.get("content-security-policy")).toContain("'strict-dynamic'");
    expect(response.headers.get("content-security-policy")).not.toContain("'unsafe-eval'");
  });

  it("keeps cacheable public store routes on the static CSP", async () => {
    proxyMocks.createClient.mockReturnValue(
      createSupabaseProxyClient({ isModuleEnabled: true, isSuperadmin: false }),
    );
    const { proxy } = await importProxyModule();
    const response = await proxy(new NextRequest("http://localhost/tienda/producto-test"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-security-policy")).toBeNull();
  });

  it("applies nonce CSP to the real password recovery route", async () => {
    const { proxy } = await importProxyModule();
    const response = await proxy(new NextRequest("http://localhost/recuperar-contrasena"));

    expect(response.headers.get("content-security-policy")).toContain("'strict-dynamic'");
    expect(response.headers.get("content-security-policy")).not.toContain("'unsafe-eval'");
  });

  it("redirects to login when an invalid/expired token is provided", async () => {
    const { proxy } = await importProxyModule();
    const request = new NextRequest("http://localhost/dashboard", {
      headers: {
        cookie: "gym_firebase_session=expired-or-malformed-token",
      },
    });
    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("allows access to admin route with a valid verified token", async () => {
    proxyMocks.createClient.mockReturnValue(
      createSupabaseProxyClient({ isModuleEnabled: true, isSuperadmin: true }),
    );
    const { proxy } = await importProxyModule();
    const request = new NextRequest("http://localhost/dashboard", {
      headers: {
        cookie: `gym_firebase_session=${createFirebaseSessionCookie("admin-1")}`,
      },
    });
    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("rewrites disabled module routes to gated 404 for non-superadmin", async () => {
    proxyMocks.createClient.mockReturnValue(
      createSupabaseProxyClient({ isModuleEnabled: false, isSuperadmin: false }),
    );

    const { proxy } = await importProxyModule();
    const request = new NextRequest("http://localhost/tienda", {
      headers: {
        cookie: `gym_firebase_session=${createFirebaseSessionCookie("user-1")}`,
      },
    });
    const response = await proxy(request);

    expect(response.headers.get("x-middleware-rewrite")).toContain("/_gated-404");
  });

  it("allows disabled module routes for verified superadmin requests", async () => {
    proxyMocks.createClient.mockReturnValue(
      createSupabaseProxyClient({ isModuleEnabled: false, isSuperadmin: true }),
    );

    const { proxy } = await importProxyModule();
    const request = new NextRequest("http://localhost/tienda", {
      headers: {
        cookie: `gym_firebase_session=${createFirebaseSessionCookie("root-1")}`,
      },
    });
    const response = await proxy(request);

    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
