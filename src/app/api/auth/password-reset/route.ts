import { NextResponse } from "next/server";
import { z } from "zod";

import { sendFirebasePasswordResetEmail } from "@/lib/firebase/email-actions";
import { sanitizeMemberRedirectPath } from "@/lib/member-auth-flow";
import {
  applyRateLimit,
  getClientIp,
  validateBody,
  withApiErrorHandling,
} from "@/lib/api-utils";

const PasswordResetSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().optional(),
});

export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    const rateLimit = await applyRateLimit(`password-reset:${getClientIp(request)}`, 3, 10 * 60_000);
    if (!rateLimit.success) return rateLimit.errorResponse;

    const validated = await validateBody(request, PasswordResetSchema);
    if ("errorResponse" in validated) return validated.errorResponse;
    const { email, next } = validated.data;

    const origin = new URL(request.url).origin;
    await sendFirebasePasswordResetEmail({
      absoluteOrigin: origin,
      email: email.toLowerCase(),
      nextPath: sanitizeMemberRedirectPath(next) || "/acceso?confirmed=1",
    });

    return NextResponse.json({ success: true });
  });
}
