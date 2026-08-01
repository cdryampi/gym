import { NextRequest, NextResponse } from "next/server";

import { requireRoles, withApiErrorHandling } from "@/lib/api-utils";
import { filterAndSortLeads, parseLeadFilters, serializeLeadsToCsv } from "@/lib/data/leads";
import { hasSupabaseSecretKey } from "@/lib/env";
import { normalizeLeads } from "@/lib/supabase/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE } from "@/lib/user-roles";

function buildCsvFilename() {
  return `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
}

export async function GET(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const auth = await requireRoles([DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE]);
    if (!auth.success) return auth.errorResponse;

    if (!hasSupabaseSecretKey()) {
      return NextResponse.json(
        { error: "Configura SUPABASE_SECRET_KEY para exportar leads reales." },
        { status: 503 },
      );
    }

    const filters = parseLeadFilters(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "No se pudieron cargar los leads para exportar." }, { status: 500 });
    }

    const leads = filterAndSortLeads(normalizeLeads(data), filters);
    const csv = serializeLeadsToCsv(leads);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${buildCsvFilename()}\"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
