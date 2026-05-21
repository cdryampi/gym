import { NextResponse } from "next/server";
import { requireRoles, withApiErrorHandling } from "@/lib/api-utils";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE, TRAINER_ROLE } from "@/lib/user-roles";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ batchId: string }> }
) {
  return withApiErrorHandling(async () => {
    const auth = await requireRoles([DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE, TRAINER_ROLE]);
    if (!auth.success) return auth.errorResponse;

    const { batchId } = await context.params;

    if (!batchId) {
      return NextResponse.json(
        { error: "El ID de lote es requerido." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient() as any;

    // 1. Fetch batch metadata
    const { data: batch, error: batchError } = await supabase
      .from("member_import_batches")
      .select("*")
      .eq("id", batchId)
      .maybeSingle();

    if (batchError) {
      throw batchError;
    }

    if (!batch) {
      return NextResponse.json(
        { error: "Lote de importación no encontrado." },
        { status: 404 }
      );
    }

    // 2. Fetch all individual row records for this batch
    const { data: rows, error: rowsError } = await supabase
      .from("member_import_rows")
      .select("*")
      .eq("batch_id", batchId)
      .order("row_number", { ascending: true });

    if (rowsError) {
      throw rowsError;
    }

    // Combine them into a single response payload
    const result = {
      ...batch,
      rows: (rows || []).map((r: any) => ({
        id: r.id,
        rowNumber: r.row_number,
        email: r.email,
        status: r.status,
        errors: r.errors || [],
        warnings: r.warnings || [],
        firebaseUid: r.firebase_uid,
        memberProfileId: r.member_profile_id,
        membershipRequestId: r.membership_request_id,
        rawRow: r.raw_row,
      })),
    };

    return NextResponse.json(result);
  });
}
