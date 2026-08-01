import { beforeEach, describe, expect, it, vi } from "vitest";

const modulesMocks = vi.hoisted(() => ({
  getDashboardAccessState: vi.fn(),
  requireSuperadminUser: vi.fn(),
  hasSupabaseServiceRole: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  revalidatePath: vi.fn(),
  revalidatePublicCacheTags: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/lib/auth", async (importOriginal) => { 
  const actual = await importOriginal<typeof import("@/lib/auth")>(); 
  return { 
    ...actual, 
    getDashboardAccessState: modulesMocks.getDashboardAccessState,
    requireSuperadminUser: modulesMocks.requireSuperadminUser,
  };
});

vi.mock("@/lib/env", () => ({
  hasSupabaseServiceRole: modulesMocks.hasSupabaseServiceRole,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: modulesMocks.createSupabaseAdminClient,
  createSupabaseServerClient: modulesMocks.createSupabaseServerClient,
}));

vi.mock("next/cache", () => ({
  revalidatePath: modulesMocks.revalidatePath,
}));

vi.mock("@/lib/cache/public-cache", () => ({
  PUBLIC_CACHE_TAGS: {
    cms: "cms",
    marketing: "marketing",
    membershipPlans: "membership-plans",
    storeCatalog: "store-catalog",
  },
  revalidatePublicCacheTags: modulesMocks.revalidatePublicCacheTags,
}));

vi.mock("next/navigation", () => ({
  notFound: modulesMocks.notFound,
}));

vi.mock("server-only", () => ({}));

async function importModulesData() {
  vi.resetModules();
  return import("./modules");
}

async function importModulesActions() {
  vi.resetModules();
  return import("./modules.actions");
}

describe("modules data service", () => {
  beforeEach(() => {
    modulesMocks.getDashboardAccessState.mockReset();
    modulesMocks.requireSuperadminUser.mockReset();
    modulesMocks.hasSupabaseServiceRole.mockReset();
    modulesMocks.createSupabaseAdminClient.mockReset();
    modulesMocks.createSupabaseServerClient.mockReset();
    modulesMocks.revalidatePath.mockReset();
    modulesMocks.revalidatePublicCacheTags.mockReset();
    modulesMocks.notFound.mockReset();
  });

  it("returns default-enabled modules merged with stored rows", async () => {
    modulesMocks.hasSupabaseServiceRole.mockReturnValue(true);
    modulesMocks.createSupabaseAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(async () => ({
          data: [
            {
              id: 1,
              name: "tienda",
              is_enabled: false,
              description: "Store",
              updated_at: "2026-04-22T00:00:00.000Z",
            },
          ],
          error: null,
        })),
      })),
    });

    const { getActiveModules } = await importModulesData();
    const result = await getActiveModules();

    expect(result).toEqual({
      tienda: false,
      rutinas: true,
      mobile: true,
      leads: true,
      marketing: true,
      cms: true,
    });
  });

  it("bypasses disabled modules for superadmin access state", async () => {
    modulesMocks.hasSupabaseServiceRole.mockReturnValue(true);
    modulesMocks.createSupabaseAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(async () => ({
          data: [
            {
              id: 1,
              name: "marketing",
              is_enabled: false,
              description: "Marketing",
              updated_at: "2026-04-22T00:00:00.000Z",
            },
          ],
          error: null,
        })),
      })),
    });

    const { assertModuleEnabledOrNotFound } = await importModulesData();

    await assertModuleEnabledOrNotFound("marketing", {
      accessMode: "superadmin",
      accessWarning: null,
      user: {
        id: "user-1",
        email: "root@gym.test",
        isLocalAdmin: true,
      },
    });

    expect(modulesMocks.notFound).not.toHaveBeenCalled();
  });

  it("does not read session state when a public module is enabled", async () => {
    modulesMocks.hasSupabaseServiceRole.mockReturnValue(true);
    modulesMocks.createSupabaseAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(async () => ({
          data: [
            {
              id: 1,
              name: "tienda",
              is_enabled: true,
              description: "Store",
              updated_at: "2026-04-22T00:00:00.000Z",
            },
          ],
          error: null,
        })),
      })),
    });

    const { assertModuleEnabledOrNotFound } = await importModulesData();

    await assertModuleEnabledOrNotFound("tienda");

    expect(modulesMocks.getDashboardAccessState).not.toHaveBeenCalled();
    expect(modulesMocks.notFound).not.toHaveBeenCalled();
  });

  it("calls notFound for disabled modules when access is not superadmin", async () => {
    modulesMocks.hasSupabaseServiceRole.mockReturnValue(true);
    modulesMocks.createSupabaseAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(async () => ({
          data: [
            {
              id: 1,
              name: "cms",
              is_enabled: false,
              description: "CMS",
              updated_at: "2026-04-22T00:00:00.000Z",
            },
          ],
          error: null,
        })),
      })),
    });

    const { assertModuleEnabledOrNotFound } = await importModulesData();

    await assertModuleEnabledOrNotFound("cms", {
      accessMode: "admin",
      accessWarning: null,
      user: {
        id: "user-2",
        email: "admin@gym.test",
        isLocalAdmin: true,
      },
    });

    expect(modulesMocks.notFound).toHaveBeenCalledTimes(1);
  });

  it("toggles a module and revalidates affected paths", async () => {
    modulesMocks.hasSupabaseServiceRole.mockReturnValue(true);
    modulesMocks.requireSuperadminUser.mockResolvedValue({
      id: "root-1",
      email: "root@gym.test",
    });
    const upsert = vi.fn(async () => ({ error: null }));
    modulesMocks.createSupabaseAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        upsert,
      })),
    });

    const { toggleModuleAction } = await importModulesActions();
    const result = await toggleModuleAction("tienda", false);

    expect(result).toEqual({ success: true });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "tienda",
        is_enabled: false,
      }),
      { onConflict: "name" },
    );
    expect(modulesMocks.revalidatePath).toHaveBeenCalledWith("/dashboard", "layout");
    expect(modulesMocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(modulesMocks.revalidatePublicCacheTags).toHaveBeenCalledWith(["store-catalog"]);
  });
});

