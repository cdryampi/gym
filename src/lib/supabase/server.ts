import { createClient } from "@supabase/supabase-js";

import { getFirebaseSessionBearerHeader } from "@/lib/firebase/server";
import { getPublicSupabaseEnv, getServerSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabasePublicClient() {
  const { url, anonKey } = getPublicSupabaseEnv();

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = getPublicSupabaseEnv();
  const authorization = await getFirebaseSessionBearerHeader();

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: authorization
      ? {
          headers: {
            Authorization: authorization,
          },
        }
      : undefined,
  });
}

export function createSupabaseAdminClient() {
  const { url, secretKey } = getServerSupabaseEnv();

  if (!secretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY for admin Supabase access.");
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
