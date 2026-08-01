import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { hasSupabaseServiceRole } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireRoles, validateRequestOrigin, withApiErrorHandling } from "@/lib/api-utils";
import { DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE } from "@/lib/user-roles";

export const runtime = "nodejs";

const MEDIA_BUCKET = "media";
const TRAINING_ZONE_VIDEO_PREFIX = "training-zones/videos";
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_VIDEO_SIZE_BYTES = 250 * 1024 * 1024; // 250MB

function getVideoExtension(contentType: string) {
  switch (contentType) {
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    case "video/quicktime":
      return "mov";
    default:
      return null;
  }
}

export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    const originCheck = validateRequestOrigin(request);
    if (!originCheck.success) return originCheck.errorResponse;

    const auth = await requireRoles([DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE]);
    if (!auth.success) return auth.errorResponse;

    if (!hasSupabaseServiceRole()) {
      return NextResponse.json(
        { error: "Configura SUPABASE_SERVICE_ROLE_KEY para subir videos al storage." },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Adjunta un video valido." }, { status: 400 });
    }

    const extension = getVideoExtension(file.type);

    if (!extension || !ALLOWED_VIDEO_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "El video debe ser MP4, WebM o QuickTime." },
        { status: 400 },
      );
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json(
        { error: "El video es demasiado pesado. El limite es 250MB." },
        { status: 400 },
      );
    }

    const objectPath = `${TRAINING_ZONE_VIDEO_PREFIX}/${randomUUID()}.${extension}`;
    const bytes = file.size;
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(objectPath, Buffer.from(await file.arrayBuffer()), {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);

    return NextResponse.json({
      url: publicUrl,
      contentType: file.type,
      bytes,
    });
  });
}
