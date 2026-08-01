import { NextResponse } from "next/server";
import { z } from "zod";

import { sendFirebaseVerifyAndChangeEmail } from "@/lib/firebase/email-actions";
import { sanitizeMemberRedirectPath } from "@/lib/member-auth-flow";
import {
  requireFirebaseUser,
  validateBody,
  validateRequestOrigin,
  withApiErrorHandling,
} from "@/lib/api-utils";

const EmailChangeSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().optional(),
});

export async function POST(request: Request) {
  return withApiErrorHandling(async (): Promise<NextResponse> => {
    const originCheck = validateRequestOrigin(request);
    if (!originCheck.success) return originCheck.errorResponse;

    const auth = await requireFirebaseUser();
    if (!auth.success) return auth.errorResponse;
    const { user } = auth;

    if (!user?.email) {
      return NextResponse.json({ error: "El usuario no tiene un email asociado." }, { status: 400 });
    }

    const validated = await validateBody(request, EmailChangeSchema);
    if ("errorResponse" in validated) return validated.errorResponse;
    const { email: nextEmail, next } = validated.data;

    const origin = new URL(request.url).origin;
    await sendFirebaseVerifyAndChangeEmail({
      absoluteOrigin: origin,
      currentEmail: user.email,
      newEmail: nextEmail.toLowerCase(),
      nextPath: sanitizeMemberRedirectPath(next) || "/mi-cuenta",
    });

    return NextResponse.json({ success: true });
  });
}
