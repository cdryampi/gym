import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireRoles, validateRequestOrigin, withApiErrorHandling } from "@/lib/api-utils";
import { executeMemberImport } from "@/lib/admin/member-import/service";
import { DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE, TRAINER_ROLE } from "@/lib/user-roles";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    const originCheck = validateRequestOrigin(request);
    if (!originCheck.success) return originCheck.errorResponse;

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

    const actorUserId = auth.user?.id || null;
    const actorEmail = auth.user?.email || null;

    const result = await executeMemberImport(
      csvContent,
      fileName,
      actorUserId,
      actorEmail
    );

    // Revalidate relevant dashboard pages
    revalidatePath("/dashboard/miembros");
    revalidatePath("/dashboard/mobile");

    return NextResponse.json(result);
  });
}
