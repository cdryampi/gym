import { afterEach, describe, expect, it, vi } from "vitest";

const envMocks = vi.hoisted(() => ({
  hasMedusaAdminEnv: vi.fn(),
  hasSupabaseSecretKey: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasMedusaAdminEnv: () => envMocks.hasMedusaAdminEnv(),
  hasSupabaseSecretKey: () => envMocks.hasSupabaseSecretKey(),
}));

describe("store admin runtime guards", () => {
  afterEach(() => {
    vi.resetModules();
    envMocks.hasMedusaAdminEnv.mockReset();
    envMocks.hasSupabaseSecretKey.mockReset();
  });

  it("blocks writes when Medusa admin credentials are missing", async () => {
    envMocks.hasMedusaAdminEnv.mockReturnValue(false);
    envMocks.hasSupabaseSecretKey.mockReturnValue(true);

    const mod = await import("@/lib/data/store-admin");

    expect(mod.getStoreAdminWriteDisabledReason()).toContain("MEDUSA_ADMIN_API_KEY");
  });

  it("blocks writes when the Supabase bridge cannot persist ids", async () => {
    envMocks.hasMedusaAdminEnv.mockReturnValue(true);
    envMocks.hasSupabaseSecretKey.mockReturnValue(false);

    const mod = await import("@/lib/data/store-admin");

    expect(mod.getStoreAdminWriteDisabledReason()).toContain("SUPABASE_SECRET_KEY");
  });
});
