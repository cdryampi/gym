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

function createQueryChain(data: unknown, options?: { single?: boolean }) {
  const result = {
    data,
    error: null,
  };

  const query = {
    eq: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({
      data: options?.single ? data : data ?? null,
      error: null,
    })),
    order: vi.fn(() => query),
    then: (resolve: (value: typeof result) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };

  return query;
}

function createSiteSettingsQuery(data: unknown) {
  return {
    select: vi.fn(() => createQueryChain(data, { single: true })),
  };
}

function createMarketingCollectionQuery(data: unknown[]) {
  return {
    select: vi.fn(() => createQueryChain(data)),
  };
}

function createTestimonialsQuery(data: unknown[]) {
  return {
    select: vi.fn(() => createQueryChain(data)),
  };
}

describe("getDashboardSnapshot", () => {
  beforeEach(() => {
    vi.resetModules();
    hasSupabasePublicEnvMock.mockReset();
    hasSupabaseServiceRoleMock.mockReset();
    createSupabasePublicClientMock.mockReset();
    createSupabaseAdminClientMock.mockReset();
  });

  it("blocks dashboard contacts instead of showing demo leads when service role is missing", async () => {
    hasSupabasePublicEnvMock.mockReturnValue(true);
    hasSupabaseServiceRoleMock.mockReturnValue(false);

    createSupabasePublicClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === "site_settings") {
          return createSiteSettingsQuery({ id: 1, site_name: "Nova Forza real" });
        }

        if (table === "marketing_testimonials") {
          return createTestimonialsQuery([]);
        }

        return createMarketingCollectionQuery([]);
      },
    });

    const { getDashboardSnapshot } = await import("@/lib/supabase/queries");
    const snapshot = await getDashboardSnapshot();

    expect(snapshot.leads).toEqual([]);
    expect(snapshot.warning).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(snapshot.settings.site_name).toBe("Nova Forza real");
  });

  it("loads plans and schedule rows from the shared marketing snapshot", async () => {
    hasSupabasePublicEnvMock.mockReturnValue(true);

    createSupabasePublicClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === "site_settings") {
          return createSiteSettingsQuery({ id: 1, site_name: "Nova Forza real" });
        }

        if (table === "marketing_plans") {
          return createMarketingCollectionQuery([
            {
              id: "plan-1",
              site_settings_id: 1,
              title: "Plan real",
              description: null,
              price_label: "S/220",
              billing_label: "/mes",
              badge: "Top",
              features: [{ label: "Libre", included: true }],
              is_featured: true,
              order: 0,
              is_active: true,
              created_at: new Date(0).toISOString(),
              updated_at: new Date(0).toISOString(),
            },
          ]);
        }

        if (table === "marketing_testimonials") {
          return createTestimonialsQuery([
            {
              id: "testimonial-1",
              site_settings_id: 1,
              member_profile_id: "member-1",
              supabase_user_id: "user-1",
              quote: "Resena real",
              rating: 5,
              author_name: "Titan Uno",
              author_detail: "Socio desde 2024",
              author_initials: "TU",
              moderation_status: "approved",
              approved_at: "2026-04-04T12:00:00.000Z",
              created_at: new Date(0).toISOString(),
              updated_at: new Date(0).toISOString(),
            },
          ]);
        }

        return createMarketingCollectionQuery([
          {
            id: "row-1",
            site_settings_id: 1,
            label: "Lunes",
            description: null,
            opens_at: "06:00 AM",
            closes_at: "10:00 PM",
            order: 0,
            is_active: true,
            created_at: new Date(0).toISOString(),
            updated_at: new Date(0).toISOString(),
          },
        ]);
      },
    });

    const { getMarketingSnapshot } = await import("@/lib/supabase/queries");
    const snapshot = await getMarketingSnapshot();

    expect(snapshot.settings.site_name).toBe("Nova Forza real");
    expect(snapshot.plans[0]?.title).toBe("Plan real");
    expect(snapshot.scheduleRows[0]?.label).toBe("Lunes");
    expect(snapshot.testimonials[0]?.author_name).toBe("Titan Uno");
  });
});
