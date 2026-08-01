import { NextResponse } from "next/server";

import {
  FIREBASE_SESSION_COOKIE,
  verifyFirebaseSessionToken,
} from "@/lib/firebase/server";
import { hasFirebaseAdminEnv } from "@/lib/env";
import { SESSION_COOKIE_OPTIONS } from "@/lib/cookie-policy";
import { validateRequestOrigin } from "@/lib/api-utils";

function buildResponse() {
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const originCheck = validateRequestOrigin(request);
  if (!originCheck.success) return originCheck.errorResponse;

  const response = buildResponse();

  if (!hasFirebaseAdminEnv()) {
    response.cookies.set(FIREBASE_SESSION_COOKIE, "", {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: 0,
    });
    return response;
  }

  const body = (await request.json().catch(() => ({}))) as { idToken?: string | null };
  const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";

  if (!idToken) {
    response.cookies.set(FIREBASE_SESSION_COOKIE, "", {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: 0,
    });
    return response;
  }

  try {
    await verifyFirebaseSessionToken(idToken);
  } catch {
    return NextResponse.json({ error: "Token de sesion invalido." }, { status: 401 });
  }

  response.cookies.set(FIREBASE_SESSION_COOKIE, idToken, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 60 * 60,
  });

  return response;
}

export async function DELETE(request: Request) {
  const originCheck = validateRequestOrigin(request);
  if (!originCheck.success) return originCheck.errorResponse;

  const response = buildResponse();
  response.cookies.set(FIREBASE_SESSION_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
