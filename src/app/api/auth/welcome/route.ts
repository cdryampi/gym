import { NextResponse } from "next/server";
import { z } from "zod";

import { hasResendEnv } from "@/lib/env";
import { sendMemberWelcomeEmail } from "@/lib/email/welcome-member";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const WelcomeBodySchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = WelcomeBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalido." }, { status: 400 });
  }

  if (!hasResendEnv()) {
    return NextResponse.json({ queued: false, skipped: true }, { status: 202 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const userExists = users.some((user) => user.email?.toLowerCase() === normalizedEmail);

    if (!userExists) {
      return NextResponse.json({ queued: false, skipped: true }, { status: 202 });
    }

    await sendMemberWelcomeEmail(parsed.data.email);

    return NextResponse.json({ queued: true });
  } catch (error) {
    console.warn(
      "[Welcome Email] No se pudo enviar el correo de bienvenida:",
      error instanceof Error ? error.message : String(error),
    );

    return NextResponse.json({ queued: false }, { status: 202 });
  }
}
