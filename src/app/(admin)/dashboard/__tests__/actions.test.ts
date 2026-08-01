import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  saveSiteSettings,
  saveMarketingContent,
  deleteLeadAction
} from "../actions";
import type { SiteSettingsValues } from "@/lib/validators/settings";
import type { MarketingContentValues } from "@/lib/validators/marketing";

// Mock de auth
vi.mock("@/lib/auth", async (importOriginal) => { 
  const actual = await importOriginal<typeof import("@/lib/auth")>(); 
  return { 
    ...actual, 
    requireAdminUser: vi.fn().mockResolvedValue({ id: "admin-1", email: "admin@test.com" }),
  };
});

// Mock de env
vi.mock("@/lib/env", () => ({
  hasSupabaseSecretKey: vi.fn().mockReturnValue(true),
}));

// Mock de Supabase
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
  })),
}));

// Mock de queries
vi.mock("@/lib/supabase/queries", () => ({
  saveSiteSettingsRecord: vi.fn().mockResolvedValue({ success: true }),
  saveMarketingContentRecord: vi.fn().mockResolvedValue({ success: true }),
  deleteLeadRecord: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock de cache
vi.mock("@/lib/cache/public-cache", () => ({
  PUBLIC_CACHE_TAGS: { marketing: "marketing", cms: "cms" },
  revalidatePublicCacheTags: vi.fn(),
}));

// Mock de next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Dashboard Main Actions Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saveSiteSettings debe fallar si requireAdminUser lanza error", async () => {
    const { requireAdminUser } = await import("@/lib/auth");
    vi.mocked(requireAdminUser).mockRejectedValue(new Error("Unauthorized"));

    await expect(saveSiteSettings({ site_name: "Test" } as unknown as SiteSettingsValues)).rejects.toThrow("Unauthorized");
  });

  it("saveMarketingContent debe fallar si requireAdminUser lanza error", async () => {
    const { requireAdminUser } = await import("@/lib/auth");
    vi.mocked(requireAdminUser).mockRejectedValue(new Error("Unauthorized"));

    const result = await saveMarketingContent({} as unknown as MarketingContentValues);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("deleteLeadAction debe fallar si requireAdminUser lanza error", async () => {
    const { requireAdminUser } = await import("@/lib/auth");
    vi.mocked(requireAdminUser).mockRejectedValue(new Error("Unauthorized"));

    await expect(deleteLeadAction("lead-1")).rejects.toThrow("Unauthorized");
  });
});

