import { NextResponse } from "next/server";

import { getCurrentMemberUser } from "@/lib/auth";
import {
  getAuthenticatedMemberTestimonial,
  upsertAuthenticatedMemberTestimonial,
} from "@/lib/data/member-account";

export async function GET() {
  const user = await getCurrentMemberUser();

  if (!user?.email) {
    return NextResponse.json(
      { error: "Necesitas iniciar sesion para ver tu resena." },
      { status: 401 },
    );
  }

  try {
    const testimonial = await getAuthenticatedMemberTestimonial();
    return NextResponse.json({ testimonial });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo cargar tu resena." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentMemberUser();

  if (!user?.email) {
    return NextResponse.json(
      { error: "Necesitas iniciar sesion para guardar tu resena." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => ({}));

  try {
    const result = await upsertAuthenticatedMemberTestimonial(body);
    return NextResponse.json({
      message:
        result.mode === "created"
          ? "Tu resena quedo pendiente de revision."
          : "Actualizaste tu resena; volvera a revision antes de publicarse.",
      mode: result.mode,
      testimonial: result.testimonial,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar tu resena." },
      { status: 400 },
    );
  }
}
