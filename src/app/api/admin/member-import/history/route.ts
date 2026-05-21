import { NextResponse } from "next/server";
import { requireRoles, withApiErrorHandling } from "@/lib/api-utils";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE, TRAINER_ROLE } from "@/lib/user-roles";

export const runtime = "nodejs";

export async function GET() {
  return withApiErrorHandling(async () => {
    const auth = await requireRoles([DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE, TRAINER_ROLE]);
    if (!auth.success) return auth.errorResponse;

    const supabase = createSupabaseAdminClient() as unknown as {
      from: (table: string) => {
        select: (cols?: string) => {
          order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: Error | null }>;
        };
      };
    };
    const { data: batches, error } = await supabase
      .from("member_import_batches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(batches || []);
  });
}
