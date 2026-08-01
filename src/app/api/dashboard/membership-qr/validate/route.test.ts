import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminUser: vi.fn(),
  getDashboardAccessState: vi.fn(),
  getServerSupabaseEnv: vi.fn().mockReturnValue({ serviceRoleKey: "test-key", url: "https://test.supabase.co" }),
  hasSupabaseServiceRole: vi.fn().mockReturnValue(true),
  getDashboardMembershipScanResultByToken: vi.fn(),
  parseMembershipQrScanToken: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({ get: vi.fn() }),
}));

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    requireAdminUser: mocks.requireAdminUser,
    getDashboardAccessState: mocks.getDashboardAccessState,
  };
});

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    getServerSupabaseEnv: mocks.getServerSupabaseEnv,
    hasSupabaseServiceRole: mocks.hasSupabaseServiceRole,
  };
});

vi.mock("@/lib/data/memberships", () => ({
  getDashboardMembershipScanResultByToken: mocks.getDashboardMembershipScanResultByToken,
  parseMembershipQrScanToken: mocks.parseMembershipQrScanToken,
}));

import { POST } from "./route";

describe("POST /api/dashboard/membership-qr/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.stubEnv("NODE_ENV", "test");
    mocks.hasSupabaseServiceRole.mockReturnValue(true);
    mocks.getDashboardAccessState.mockResolvedValue({
      user: { id: "admin-1", email: "admin@test.com" },
      accessMode: "admin",
      accessWarning: null
    });
    mocks.parseMembershipQrScanToken.mockReturnValue("token");
    mocks.getDashboardMembershipScanResultByToken.mockResolvedValue({ status: "ok" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails if requireAdminUser fails (redirects/throws)", async () => {
    mocks.getDashboardAccessState.mockResolvedValue({
      user: null,
      accessMode: null,
      accessWarning: null
    });
    const response = await POST(new Request("http://localhost", { method: "POST" }));
    expect(response.status).toBe(401);
  });

  it("returns 400 if scannedValue is missing", async () => {
    mocks.requireAdminUser.mockResolvedValue({ id: "admin-1", app_metadata: { roles: ["admin"] } });
    const response = await POST(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({}) })
    );
    expect(response.status).toBe(400);
  });

  it("returns 200 on successful validation", async () => {
    mocks.requireAdminUser.mockResolvedValue({ id: "admin-1", app_metadata: { roles: ["admin"] } });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        status: "ok", 
        canEnter: true,
        reasonCode: "ok",
        validationLabel: "Membresia al dia",
        member: null,
        membershipRequest: null,
        scannedToken: "token",
        errorMessage: null,
        publicValidationUrl: null
      }),
    } as unknown as Response);

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ scannedValue: "token" }),
        headers: { host: "localhost", origin: "http://localhost" },
      })
    );
    expect(response.status).toBe(200);
  });

  it("does not leak stack traces on internal errors", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.requireAdminUser.mockResolvedValue({ id: "admin-1", app_metadata: { roles: ["admin"] } });
    vi.mocked(fetch).mockRejectedValue(new Error("Sensitive internal error"));
    mocks.parseMembershipQrScanToken.mockImplementation(() => { throw new Error("Fallback failed"); });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ scannedValue: "token" }),
        headers: { host: "localhost", origin: "http://localhost" },
      })
    );

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(JSON.stringify(data)).not.toContain("Sensitive internal error");
  });
});
