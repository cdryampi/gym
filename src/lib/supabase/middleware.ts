import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getPublicSupabaseEnv, hasSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function updateSession(request: NextRequest, initialResponse?: NextResponse) {
  if (!hasSupabasePublicEnv()) {
    return initialResponse ?? NextResponse.next({ request });
  }

  const { url, anonKey } = getPublicSupabaseEnv();
  let response =
    initialResponse ??
    NextResponse.next({
      request,
    });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  void supabase.auth.getUser().catch(() => undefined);

  return response;
}
