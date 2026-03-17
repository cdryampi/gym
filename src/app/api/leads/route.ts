import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createLeadRecord } from "@/lib/supabase/queries";
import { contactFormSchema } from "@/lib/validators/contact";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = contactFormSchema.parse(body);

    const supabase = await createSupabaseServerClient();
    await createLeadRecord(supabase, parsed);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LEADS_POST]", error);
    
    const message = error instanceof Error ? error.message : "Error al procesar el mensaje";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
