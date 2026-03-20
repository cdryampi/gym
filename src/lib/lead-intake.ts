import { NextResponse } from "next/server";

import { hasSupabasePublicEnv } from "@/lib/env";
import { createLeadRecord } from "@/lib/supabase/queries";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { contactFormSchema } from "@/lib/validators/contact";

export async function handleLeadIntakeRequest(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud invalida." }, { status: 400 });
  }

  const parsed = contactFormSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos invalidos." },
      { status: 400 },
    );
  }

  if (!hasSupabasePublicEnv()) {
    return NextResponse.json(
      { error: "Supabase no esta configurado todavia." },
      { status: 503 },
    );
  }

  try {
    const supabase = createSupabasePublicClient();
    await createLeadRecord(supabase, parsed.data);

    return NextResponse.json({
      success: true,
      message: "Solicitud guardada correctamente.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el lead en Supabase.",
      },
      { status: 500 },
    );
  }
}
