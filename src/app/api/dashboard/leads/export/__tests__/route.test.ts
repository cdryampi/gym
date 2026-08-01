import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const routeMocks = vi.hoisted(() => ({
  requireAdminUser: vi.fn(),
  getDashboardAccessState: vi.fn(),
  exportLeadsToCsv: vi.fn(),
  hasSupabaseSecretKey: vi.fn().mockReturnValue(true),
  getServerSupabaseEnv: vi.fn().mockReturnValue({ url: "https://test.supabase.co", secretKey: "key" }),
  getPublicSupabaseEnv: vi.fn().mockReturnValue({ url: "https://test.supabase.co", anonKey: "key" }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({ get: vi.fn() }),
}));

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    requireAdminUser: routeMocks.requireAdminUser,
    getDashboardAccessState: routeMocks.getDashboardAccessState,
  };
});

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    hasSupabaseSecretKey: routeMocks.hasSupabaseSecretKey,
    getServerSupabaseEnv: routeMocks.getServerSupabaseEnv,
    getPublicSupabaseEnv: routeMocks.getPublicSupabaseEnv,
  };
});

vi.mock("@/lib/data/leads", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/leads")>();
  return {
    ...actual,
    exportLeadsToCsv: routeMocks.exportLeadsToCsv,
    parseLeadFilters: vi.fn().mockReturnValue({}),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: [{ id: "lead-1" }], error: null }),
    storage: {
      from: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "http://test.com/leads.csv" } }),
      }),
    },
  }),
}));

import { GET } from "../route";

function buildRequest() {
  return new NextRequest("http://localhost/api/dashboard/leads/export");
}

describe("GET /api/dashboard/leads/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getDashboardAccessState.mockResolvedValue({
      user: { id: "admin-1", email: "admin@test.com" },
      accessMode: "admin",
      accessWarning: null
    });
  });

  it("exports leads to CSV for admin user", async () => {
    routeMocks.requireAdminUser.mockResolvedValue({ 
        id: "admin-1",
        app_metadata: { roles: ["admin"] }
    } as unknown as { id: string; app_metadata: { roles: string[] } });
    routeMocks.exportLeadsToCsv.mockResolvedValue("name,email\ntest,test@test.com");

    const response = await GET(buildRequest());
    expect(response.status).toBe(200);
  });

  it("fails if user is not an admin", async () => {
    routeMocks.getDashboardAccessState.mockResolvedValue({
      user: null,
      accessMode: null,
      accessWarning: null
    });
    const response = await GET(buildRequest());
    expect(response.status).toBe(401);
  });
});
