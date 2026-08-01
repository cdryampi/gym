import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { requireRoles, validateRequestOrigin, withApiErrorHandling } from "@/lib/api-utils";
import {
  runMemberImport,
  type MemberImportMode,
  type MemberImportSupabaseClient,
} from "@/lib/data/member-import";
import { hasFirebaseAdminEnv, hasSupabaseSecretKey } from "@/lib/env";
import { getFirebaseAdminAuth } from "@/lib/firebase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE } from "@/lib/user-roles";

export const runtime = "nodejs";

function isImportMode(value: FormDataEntryValue | null): value is MemberImportMode {
  return value === "preview" || value === "commit";
}

function getDefaultImportPassword() {
  return process.env.FIREBASE_MEMBER_IMPORT_DEFAULT_PASSWORD?.trim() ?? "";
}

export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    const originCheck = validateRequestOrigin(request);
    if (!originCheck.success) return originCheck.errorResponse;

    const auth = await requireRoles([DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE]);
    if (!auth.success) return auth.errorResponse;

    const formData = await request.formData();
    const mode = formData.get("mode");
    const file = formData.get("file");

    if (!isImportMode(mode)) {
      return NextResponse.json({ error: "Modo de importacion invalido." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Adjunta un archivo CSV o XLSX valido." }, { status: 400 });
    }

    if (mode === "commit") {
      if (!hasSupabaseSecretKey()) {
        return NextResponse.json(
          { error: "Configura SUPABASE_SECRET_KEY para importar socios." },
          { status: 503 },
        );
      }

      if (!hasFirebaseAdminEnv()) {
        return NextResponse.json(
          { error: "Configura Firebase Admin para importar socios con acceso digital." },
          { status: 503 },
        );
      }

      if (!getDefaultImportPassword()) {
        return NextResponse.json(
          {
            error:
              "Configura FIREBASE_MEMBER_IMPORT_DEFAULT_PASSWORD para crear usuarios importados.",
          },
          { status: 503 },
        );
      }
    }

    const result = await runMemberImport({
      auth: mode === "commit" ? getFirebaseAdminAuth() : undefined,
      buffer: Buffer.from(await file.arrayBuffer()),
      client:
        mode === "commit"
          ? (createSupabaseAdminClient() as unknown as MemberImportSupabaseClient)
          : undefined,
      defaultPassword: mode === "commit" ? getDefaultImportPassword() : undefined,
      filename: file.name,
      mode,
    });

    if (mode === "commit") {
      revalidatePath("/dashboard/miembros");
      revalidatePath("/dashboard/mobile");
    }

    return NextResponse.json(result);
  });
}
