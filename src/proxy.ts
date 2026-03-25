import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getPublicSupabaseEnv, hasSupabasePublicEnv } from "@/lib/env";

const ADMIN_ROUTES = ["/dashboard"];
const LOGIN_PATH = "/login";

function isSupabaseAuthApiError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    __isAuthError?: boolean;
    status?: number;
  };

  return candidate.__isAuthError === true || candidate.status === 401;
}

function isAdminRoute(pathname: string) {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!hasSupabasePublicEnv()) {
    return response;
  }

  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getPublicSupabaseEnv();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  let user = null;

  try {
    const {
      data: { user: resolvedUser },
    } = await supabase.auth.getUser();

    user = resolvedUser;
  } catch (error) {
    if (!isSupabaseAuthApiError(error)) {
      throw error;
    }

    console.error("Supabase auth is misconfigured in proxy.", error);
  }

  if (isAdminRoute(request.nextUrl.pathname) && !user) {
    const localAdminCookie = request.cookies.get("gym_admin_session")?.value;

    if (!localAdminCookie) {
      const loginUrl = new URL(LOGIN_PATH, request.url);
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      loginUrl.searchParams.set("error", "admin-only");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
