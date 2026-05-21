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

    const supabase = createSupabaseAdminClient() as unknown as {
      from: (table: string) => {
        select: (cols?: string) => {
          eq: (col: string, val: string | number) => {
            maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: Error | null }>;
            order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: Error | null }>;
          };
        };
      };
    };

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

    interface ImportRowRecord {
      id: string;
      row_number: number;
      email: string;
      status: string;
      errors?: string[];
      warnings?: string[];
      firebase_uid?: string;
      member_profile_id?: string;
      membership_request_id?: string;
      raw_row: Record<string, string>;
    }

    // Combine them into a single response payload
    const result = {
      ...batch,
      rows: ((rows as unknown as ImportRowRecord[]) || []).map((r) => ({
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
