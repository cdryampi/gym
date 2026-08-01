import { NextResponse } from "next/server";

import { requireRoles, withApiErrorHandling } from "@/lib/api-utils";
import { hasSupabaseSecretKey } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE, TRAINER_ROLE } from "@/lib/user-roles";

/**
 * Escapes a CSV value by wrapping in quotes and escaping internal quotes.
 * Handles null/undefined values and values with commas, newlines, or quotes.
 */
function escapeCsv(value: string | number | null | undefined) {
  if (value === null || typeof value === "undefined") {
    return "";
  }

  const normalized = String(value);

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

/**
 * CSV headers matching the member_profiles table schema.
 * Ordered logically: identifiers, personal info, contact, status, legacy, system.
 */
const MEMBER_CSV_HEADERS = [
  "id",
  "member_number",
  "full_name",
  "email",
  "phone",
  "status",
  "branch_name",
  "join_date",
  "birth_date",
  "gender",
  "address",
  "district_or_urbanization",
  "occupation",
  "preferred_schedule",
  "external_code",
  "profile_completed",
  "notes",
  "legacy_notes",
  "training_plan_label",
  "membership_plan_id",
  "membership_qr_token",
  "supabase_user_id",
  "trainer_user_id",
  "created_at",
  "updated_at",
];

/**
 * Builds the CSV filename with today's date.
 */
function buildMemberCsvFilename() {
  return `socios-export-${new Date().toISOString().slice(0, 10)}.csv`;
}

/**
 * API route handler for exporting members to CSV.
 * GET /api/dashboard/members/export?q=&status=
 * 
 * Supports filtering by search query (q) and status.
 * Returns a CSV file with all member_profiles fields.
 */
export async function GET(request: Request) {
  return withApiErrorHandling(async () => {
    const auth = await requireRoles([TRAINER_ROLE, DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE]);
    if (!auth.success) return auth.errorResponse;

    if (!hasSupabaseSecretKey()) {
      return NextResponse.json(
        { error: "Configura SUPABASE_SECRET_KEY para exportar socios." },
        { status: 503 }
      );
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("q") ?? "";
    const status = url.searchParams.get("status") ?? "";

    const supabase = createSupabaseAdminClient();
    
    // Build query
    let query = supabase
      .from("member_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply status filter
    if (status) {
      query = query.eq("status", status);
    }

    // Apply search filter (name, email, member_number, external_code)
    if (search.trim()) {
      const escaped = search
        .replace(/,/g, "\\,")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
      query = query.or(
        `full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,member_number.ilike.%${escaped}%,external_code.ilike.%${escaped}%`
      );
    }

    const { data: members, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "No se pudieron cargar los socios para exportar." },
        { status: 500 }
      );
    }

    // Build CSV rows
    const rows = [
      MEMBER_CSV_HEADERS.join(","),
      ...(members || []).map((member) =>
        [
          escapeCsv(member.id),
          escapeCsv(member.member_number),
          escapeCsv(member.full_name),
          escapeCsv(member.email),
          escapeCsv(member.phone),
          escapeCsv(member.status),
          escapeCsv(member.branch_name),
          escapeCsv(member.join_date),
          escapeCsv(member.birth_date),
          escapeCsv(member.gender),
          escapeCsv(member.address),
          escapeCsv(member.district_or_urbanization),
          escapeCsv(member.occupation),
          escapeCsv(member.preferred_schedule),
          escapeCsv(member.external_code),
          escapeCsv(member.profile_completed ? "Si" : "No"),
          escapeCsv(member.notes),
          escapeCsv(member.legacy_notes),
          escapeCsv(member.training_plan_label),
          escapeCsv(member.membership_plan_id),
          escapeCsv(member.membership_qr_token),
          escapeCsv(member.supabase_user_id),
          escapeCsv(member.trainer_user_id),
          escapeCsv(member.created_at),
          escapeCsv(member.updated_at),
        ].join(",")
      ),
    ];

    const csv = "\uFEFF" + rows.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${buildMemberCsvFilename()}"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
