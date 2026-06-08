import { NextResponse } from "next/server";
import { requireRoles, withApiErrorHandling } from "@/lib/api-utils";
import { validateCsvData } from "@/lib/admin/member-import/service";
import { DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE, TRAINER_ROLE } from "@/lib/user-roles";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    const auth = await requireRoles([DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE, TRAINER_ROLE]);
    if (!auth.success) return auth.errorResponse;

    const body = await request.json();
    const { csvContent, fileName } = body;

    if (typeof csvContent !== "string" || typeof fileName !== "string") {
      return NextResponse.json(
        { error: "El contenido del CSV y el nombre del archivo son obligatorios." },
        { status: 400 }
      );
    }

    const result = await validateCsvData(csvContent, fileName);
    return NextResponse.json(result);
  });
}
