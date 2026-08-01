import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { PRODUCT_IMAGES_BUCKET } from "@/lib/commerce/image-urls";
import { hasSupabaseSecretKey } from "@/lib/env";
import { requireRoles, validateRequestOrigin, withApiErrorHandling } from "@/lib/api-utils";
import { isSupportedImageContentType, optimizeImage } from "@/lib/media/optimize-image";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE } from "@/lib/user-roles";

export const runtime = "nodejs";
const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;

const BUCKETS = {
  product: PRODUCT_IMAGES_BUCKET,
  team: PRODUCT_IMAGES_BUCKET,
  branding: "branding",
  favicon: "branding",
  "training-zone": "media",
} as const;

const SCOPE_PREFIX: Record<keyof typeof BUCKETS, string> = {
  product: "products",
  team: "marketing/team",
  branding: "logos",
  favicon: "favicons",
  "training-zone": "training-zones/posters",
};

function isValidScope(value: FormDataEntryValue | null): value is keyof typeof BUCKETS {
  return (
    value === "product" ||
    value === "team" ||
    value === "branding" ||
    value === "favicon" ||
    value === "training-zone"
  );
}

function buildStorageObjectPath(scope: keyof typeof BUCKETS, extension: string) {
  return `${SCOPE_PREFIX[scope]}/${randomUUID()}.${extension}`;
}

export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    const originCheck = validateRequestOrigin(request);
    if (!originCheck.success) return originCheck.errorResponse;

    const auth = await requireRoles([DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE]);
    if (!auth.success) return auth.errorResponse;

    if (!hasSupabaseSecretKey()) {
      return NextResponse.json(
        { error: "Configura SUPABASE_SECRET_KEY para subir imagenes al storage." },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const scope = formData.get("scope");
    const file = formData.get("file");

    if (!isValidScope(scope)) {
      return NextResponse.json(
        { error: "El scope de imagen no es valido." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Adjunta una imagen valida." }, { status: 400 });
    }

    if (!isSupportedImageContentType(file.type)) {
      return NextResponse.json(
        { error: "Solo se admiten imagenes JPEG, PNG o WEBP." },
        { status: 400 },
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "La imagen es demasiado pesada. El limite es 15MB." },
        { status: 413 },
      );
    }

    const bucketName = BUCKETS[scope];

    const optimized = await optimizeImage({
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });
    
    const objectPath = buildStorageObjectPath(scope, optimized.extension);
    const supabase = createSupabaseAdminClient();
    
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(objectPath, optimized.buffer, {
        cacheControl: "31536000",
        contentType: optimized.contentType,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(objectPath);

    return NextResponse.json({
      url: publicUrl,
      contentType: optimized.contentType,
      width: optimized.width,
      height: optimized.height,
      bytes: optimized.bytes,
    });
  });
}
