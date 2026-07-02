import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseServerMocks = vi.hoisted(() => ({
  createSupabaseAdminClient: vi.fn(),
  createSupabasePublicClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: supabaseServerMocks.createSupabaseAdminClient,
  createSupabasePublicClient: supabaseServerMocks.createSupabasePublicClient,
}));

function createMembershipPlansClientMock() {
  const result = {
    data: [
      {
        id: "plan_1",
        slug: "base-30d",
        title: "Membresia Base",
        description: null,
        price_amount: 120,
        currency_code: "PEN",
        billing_label: "30 dias",
        duration_days: 30,
        is_active: true,
        is_featured: true,
        sort_order: 10,
        notes: null,
        medusa_product_id: null,
        medusa_variant_id: null,
        medusa_sync_status: "pending",
        medusa_sync_error: null,
        medusa_synced_at: null,
        created_at: "2026-04-08T08:00:00.000Z",
        updated_at: "2026-04-08T08:00:00.000Z",
      },
    ],
    error: null,
  };
  const filters: Array<[string, unknown]> = [];

  const query = {
    order: vi.fn(() => query),
    eq: vi.fn((column: string, value: unknown) => {
      filters.push([column, value]);
      return query;
    }),
    gt: vi.fn((column: string, value: unknown) => {
      filters.push([column, value]);
      return query;
    }),
    ...result,
    then: undefined,
  };

  return {
    filters,
    query,
    client: {
      from: vi.fn(() => ({
        select: vi.fn(() => query),
      })),
    },
  };
}

describe("listMembershipPlans", () => {
  beforeEach(() => {
    vi.resetModules();
    supabaseServerMocks.createSupabaseAdminClient.mockReset();
    supabaseServerMocks.createSupabasePublicClient.mockReset();
  });

  it("uses the public Supabase client for active plans", async () => {
    const publicClientMock = createMembershipPlansClientMock();
    supabaseServerMocks.createSupabasePublicClient.mockReturnValue(publicClientMock.client);

    const { listMembershipPlans } = await import("@/lib/data/memberships");
    const plans = await listMembershipPlans({ activeOnly: true });

    expect(plans).toHaveLength(1);
    expect(supabaseServerMocks.createSupabasePublicClient).toHaveBeenCalledTimes(1);
    expect(supabaseServerMocks.createSupabaseAdminClient).not.toHaveBeenCalled();
    expect(publicClientMock.query.eq).toHaveBeenCalledWith("is_active", true);
    expect(publicClientMock.query.gt).toHaveBeenCalledWith("price_amount", 0);
    expect(publicClientMock.filters).toEqual([
      ["is_active", true],
      ["price_amount", 0],
    ]);
  });

  it("keeps the admin client for non-filtered dashboard reads", async () => {
    const adminClientMock = createMembershipPlansClientMock();
    supabaseServerMocks.createSupabaseAdminClient.mockReturnValue(adminClientMock.client);

    const { listMembershipPlans } = await import("@/lib/data/memberships");
    const plans = await listMembershipPlans({ activeOnly: false });

    expect(plans).toHaveLength(1);
    expect(supabaseServerMocks.createSupabaseAdminClient).toHaveBeenCalledTimes(1);
    expect(supabaseServerMocks.createSupabasePublicClient).not.toHaveBeenCalled();
    expect(adminClientMock.query.eq).not.toHaveBeenCalled();
  });
});
