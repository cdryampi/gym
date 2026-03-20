import { beforeEach, describe, expect, it, vi } from "vitest";

const hasSupabasePublicEnvMock = vi.fn();
const hasSupabaseServiceRoleMock = vi.fn();
const createSupabasePublicClientMock = vi.fn();
const createSupabaseAdminClientMock = vi.fn();

vi.mock("@/lib/env", async () => {
  const actual = await vi.importActual<typeof import("@/lib/env")>("@/lib/env");
  return {
    ...actual,
    hasSupabasePublicEnv: () => hasSupabasePublicEnvMock(),
    hasSupabaseServiceRole: () => hasSupabaseServiceRoleMock(),
  };
});

vi.mock("@/lib/supabase/server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/supabase/server")>(
    "@/lib/supabase/server",
  );
  return {
    ...actual,
    createSupabasePublicClient: () => createSupabasePublicClientMock(),
    createSupabaseAdminClient: () => createSupabaseAdminClientMock(),
  };
});

describe("getDashboardSnapshot", () => {
  beforeEach(() => {
    hasSupabasePublicEnvMock.mockReset();
    hasSupabaseServiceRoleMock.mockReset();
    createSupabasePublicClientMock.mockReset();
    createSupabaseAdminClientMock.mockReset();
  });

  it("blocks dashboard contacts instead of showing demo leads when service role is missing", async () => {
    hasSupabasePublicEnvMock.mockReturnValue(true);
    hasSupabaseServiceRoleMock.mockReturnValue(false);

    createSupabasePublicClientMock.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { site_name: "Nova Forza real" },
              error: null,
            }),
          }),
        }),
      }),
    });

    const { getDashboardSnapshot } = await import("@/lib/supabase/queries");
    const snapshot = await getDashboardSnapshot();

    expect(snapshot.leads).toEqual([]);
    expect(snapshot.warning).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(snapshot.settings.site_name).toBe("Nova Forza real");
  });
});
