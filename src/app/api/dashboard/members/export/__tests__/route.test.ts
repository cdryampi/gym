import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const routeMocks = vi.hoisted(() => ({
  createSupabaseAdminClient: vi.fn(),
  hasSupabaseSecretKey: vi.fn(),
  requireRoles: vi.fn(),
}));

vi.mock("@/lib/api-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-utils")>();
  return {
    ...actual,
    requireRoles: routeMocks.requireRoles,
  };
});

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    hasSupabaseSecretKey: routeMocks.hasSupabaseSecretKey,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: routeMocks.createSupabaseAdminClient,
}));

type MemberRow = {
  id: string;
  member_number: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  branch_name: string | null;
  join_date: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  district_or_urbanization: string | null;
  occupation: string | null;
  preferred_schedule: string | null;
  external_code: string | null;
  profile_completed: boolean | null;
  notes: string | null;
  legacy_notes: string | null;
  training_plan_label: string | null;
  membership_plan_id: string | null;
  membership_qr_token: string | null;
  supabase_user_id: string | null;
  trainer_user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function buildRequest(search = "") {
  return new NextRequest(`http://localhost/api/dashboard/members/export${search}`);
}

function createSupabaseRouteDouble(
  members: MemberRow[] = [],
  options?: {
    error?: { message: string };
  },
) {
  const state = {
    eqCalls: [] as Array<{ field: string; value: string }>,
    orCalls: [] as string[],
    selectCalls: [] as string[],
    orderCalls: [] as Array<{ field: string; options?: { ascending?: boolean } }>,
  };

  const builder = {
    select(value: string) {
      state.selectCalls.push(value);
      return builder;
    },
    order(field: string, queryOptions?: { ascending?: boolean }) {
      state.orderCalls.push({ field, options: queryOptions });
      return builder;
    },
    eq(field: string, value: string) {
      state.eqCalls.push({ field, value });
      return builder;
    },
    or(value: string) {
      state.orCalls.push(value);
      return builder;
    },
    then(resolve: (value: { data: MemberRow[] | null; error: { message: string } | null }) => unknown) {
      return Promise.resolve(
        resolve({
          data: options?.error ? null : members,
          error: options?.error ?? null,
        }),
      );
    },
  };

  return {
    client: {
      from: vi.fn().mockReturnValue(builder),
    },
    state,
  };
}

describe("GET /api/dashboard/members/export", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    routeMocks.hasSupabaseSecretKey.mockReturnValue(true);
    routeMocks.requireRoles.mockResolvedValue({
      success: true,
      user: { id: "admin-1" },
      accessMode: "admin",
    });
  });

  it("returns 401 when dashboard auth fails", async () => {
    routeMocks.requireRoles.mockResolvedValue({
      success: false,
      errorResponse: Response.json({ error: "No autenticado." }, { status: 401 }),
    });

    const { GET } = await import("../route");
    const response = await GET(buildRequest());

    expect(response.status).toBe(401);
  });

  it("returns 403 when dashboard role is insufficient", async () => {
    routeMocks.requireRoles.mockResolvedValue({
      success: false,
      errorResponse: Response.json({ error: "No tienes permisos suficientes." }, { status: 403 }),
    });

    const { GET } = await import("../route");
    const response = await GET(buildRequest());

    expect(response.status).toBe(403);
  });

  it("returns 503 when service role env is missing", async () => {
    routeMocks.hasSupabaseSecretKey.mockReturnValue(false);

    const { GET } = await import("../route");
    const response = await GET(buildRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Configura SUPABASE_SECRET_KEY para exportar socios.",
    });
  });

  it("builds csv, headers, filters and escapes values", async () => {
    const member = {
      id: "member-1",
      member_number: "NF-001",
      full_name: "Titan, \"Prime\"",
      email: "titan@test.com",
      phone: "999\n111",
      status: "active",
      branch_name: "Centro",
      join_date: "2026-05-01",
      birth_date: "1995-01-01",
      gender: "M",
      address: "Av. Demo",
      district_or_urbanization: "Centro",
      occupation: "Coach",
      preferred_schedule: "AM",
      external_code: "EXT-1",
      profile_completed: true,
      notes: "Linea 1\nLinea 2",
      legacy_notes: "Legado",
      training_plan_label: "Plan Titan",
      membership_plan_id: "plan-1",
      membership_qr_token: "qr-1",
      supabase_user_id: "user-1",
      trainer_user_id: "trainer-1",
      created_at: "2026-05-01T12:00:00.000Z",
      updated_at: "2026-05-02T12:00:00.000Z",
    } satisfies MemberRow;
    const supabase = createSupabaseRouteDouble([member]);
    routeMocks.createSupabaseAdminClient.mockReturnValue(supabase.client);

    const { GET } = await import("../route");
    const response = await GET(buildRequest("?q= Titan, (Prime) &status=active"));
    const rawBytes = new Uint8Array(await response.clone().arrayBuffer());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toMatch(/^attachment; filename="socios-export-\d{4}-\d{2}-\d{2}\.csv"$/);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(Array.from(rawBytes.slice(0, 3))).toEqual([239, 187, 191]);
    expect(body).toContain(
      "id,member_number,full_name,email,phone,status,branch_name,join_date,birth_date,gender,address,district_or_urbanization,occupation,preferred_schedule,external_code,profile_completed,notes,legacy_notes,training_plan_label,membership_plan_id,membership_qr_token,supabase_user_id,trainer_user_id,created_at,updated_at",
    );
    expect(body).toContain("\"Titan, \"\"Prime\"\"\"");
    expect(body).toContain("\"999\n111\"");
    expect(body).toContain("\"Linea 1\nLinea 2\"");
    expect(body).toContain(",Si,");
    expect(supabase.state.eqCalls).toContainEqual({ field: "status", value: "active" });
    expect(supabase.state.orCalls).toEqual([
      "full_name.ilike.% Titan\\, \\(Prime\\) %,email.ilike.% Titan\\, \\(Prime\\) %,member_number.ilike.% Titan\\, \\(Prime\\) %,external_code.ilike.% Titan\\, \\(Prime\\) %",
    ]);
  });

  it("returns 500 when member query fails", async () => {
    const supabase = createSupabaseRouteDouble([], {
      error: { message: "db down" },
    });
    routeMocks.createSupabaseAdminClient.mockReturnValue(supabase.client);

    const { GET } = await import("../route");
    const response = await GET(buildRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "No se pudieron cargar los socios para exportar.",
    });
  });
});
