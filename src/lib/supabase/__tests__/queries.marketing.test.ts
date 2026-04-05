import { describe, expect, it, vi } from "vitest";

import {
  defaultMarketingPlans,
  defaultMarketingScheduleRows,
  defaultMarketingTestimonials,
} from "@/lib/data/marketing-content";
import {
  normalizeMarketingPlans,
  normalizeMarketingScheduleRows,
  normalizeMarketingTestimonials,
  saveMarketingContentRecord,
} from "@/lib/supabase/queries";
import type { MarketingContentValues } from "@/lib/validators/marketing";

describe("normalizeMarketingPlans", () => {
  it("falls back safely and keeps plans ordered", () => {
    const plans = normalizeMarketingPlans([
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        title: "Plan B",
        price_label: "S/300",
        billing_label: "/mes",
        features: [{ label: "Incluye coach", included: true }],
        order: 2,
        is_active: true,
        is_featured: false,
        site_settings_id: 1,
        created_at: defaultMarketingPlans[0].created_at,
        updated_at: defaultMarketingPlans[0].updated_at,
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        title: "Plan A",
        price_label: "S/150",
        billing_label: "/mes",
        features: [{ label: "Acceso libre", included: true }],
        order: 0,
        is_active: true,
        is_featured: true,
        site_settings_id: 1,
        created_at: defaultMarketingPlans[0].created_at,
        updated_at: defaultMarketingPlans[0].updated_at,
      },
    ]);

    expect(plans.map((plan) => plan.title)).toEqual(["Plan A", "Plan B"]);
    expect(normalizeMarketingPlans(null)).toHaveLength(defaultMarketingPlans.length);
  });
});

describe("normalizeMarketingScheduleRows", () => {
  it("falls back safely and keeps rows ordered", () => {
    const rows = normalizeMarketingScheduleRows([
      {
        id: "99999999-9999-9999-9999-999999999999",
        label: "Noche",
        opens_at: "06:00 PM",
        closes_at: "11:00 PM",
        order: 1,
        is_active: true,
        site_settings_id: 1,
        created_at: defaultMarketingScheduleRows[0].created_at,
        updated_at: defaultMarketingScheduleRows[0].updated_at,
      },
      {
        id: "88888888-8888-8888-8888-888888888888",
        label: "Manana",
        opens_at: "06:00 AM",
        closes_at: "12:00 PM",
        order: 0,
        is_active: true,
        site_settings_id: 1,
        created_at: defaultMarketingScheduleRows[0].created_at,
        updated_at: defaultMarketingScheduleRows[0].updated_at,
      },
    ]);

    expect(rows.map((row) => row.label)).toEqual(["Manana", "Noche"]);
    expect(normalizeMarketingScheduleRows(null)).toHaveLength(defaultMarketingScheduleRows.length);
  });
});

describe("normalizeMarketingTestimonials", () => {
  it("keeps testimonials normalized and ordered by query output", () => {
    const testimonials = normalizeMarketingTestimonials([
      {
        id: "testimonial-1",
        site_settings_id: 1,
        member_profile_id: "member-1",
        supabase_user_id: "user-1",
        quote: "El mejor lugar para entrenar con constancia.",
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

    expect(testimonials).toHaveLength(1);
    expect(testimonials[0]?.author_name).toBe("Titan Uno");
    expect(testimonials[0]?.rating).toBe(5);
    expect(normalizeMarketingTestimonials(null)).toEqual(defaultMarketingTestimonials);
  });
});

describe("saveMarketingContentRecord", () => {
  it("upserts current rows and removes omitted ids from both tables", async () => {
    const upserts: Record<string, unknown[]> = {};
    const deletes: Record<string, string[]> = {};

    const supabase = {
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({
            data:
              table === "marketing_plans"
                ? [{ id: "plan-kept" }, { id: "plan-old" }]
                : [{ id: "row-kept" }, { id: "row-old" }],
            error: null,
          })),
        })),
        upsert: vi.fn(async (payload: unknown[]) => {
          upserts[table] = payload;
          return { error: null };
        }),
        delete: vi.fn(() => ({
          in: vi.fn(async (_column: string, ids: string[]) => {
            deletes[table] = ids;
            return { error: null };
          }),
        })),
      })),
    };

    const values: MarketingContentValues = {
      plans: [
        {
          id: "plan-kept",
          title: "Plan central",
          description: "",
          price_label: "S/199",
          billing_label: "/mes",
          badge: "",
          is_featured: true,
          is_active: true,
          order: 0,
          features: [{ label: "Coach", included: true }],
        },
      ],
      scheduleRows: [
        {
          id: "row-kept",
          label: "Lunes a viernes",
          description: "",
          opens_at: "06:00 AM",
          closes_at: "10:00 PM",
          is_active: true,
          order: 0,
        },
      ],
    };

    await saveMarketingContentRecord(supabase as never, values);

    expect(upserts.marketing_plans).toHaveLength(1);
    expect(upserts.marketing_schedule_rows).toHaveLength(1);
    expect(deletes.marketing_plans).toEqual(["plan-old"]);
    expect(deletes.marketing_schedule_rows).toEqual(["row-old"]);
  });
});
