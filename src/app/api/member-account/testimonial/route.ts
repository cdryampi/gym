import { NextResponse } from "next/server";

import {
  getAuthenticatedMemberTestimonial,
  upsertAuthenticatedMemberTestimonial,
} from "@/lib/data/member-account";
import {
  requireFirebaseUser,
  validateRequestOrigin,
  withApiErrorHandling,
} from "@/lib/api-utils";

export async function GET() {
  return withApiErrorHandling(async () => {
    const auth = await requireFirebaseUser();
    if (!auth.success) return auth.errorResponse;

    const testimonial = await getAuthenticatedMemberTestimonial();
    return NextResponse.json({ testimonial });
  });
}

export async function PATCH(request: Request) {
  return withApiErrorHandling(async () => {
    const originCheck = validateRequestOrigin(request);
    if (!originCheck.success) return originCheck.errorResponse;

    const auth = await requireFirebaseUser();
    if (!auth.success) return auth.errorResponse;

    const body = await request.json().catch(() => ({}));

    const result = await upsertAuthenticatedMemberTestimonial(body);
    return NextResponse.json({
      message:
        result.mode === "created"
          ? "Tu resena quedo pendiente de revision."
          : "Actualizaste tu resena; volvera a revision antes de publicarse.",
      mode: result.mode,
      testimonial: result.testimonial,
    });
  });
}
