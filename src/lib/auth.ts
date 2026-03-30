import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_LOGIN_PATH } from "@/lib/admin";
import { isAllowedAdminEmail as isAllowedAdminEmailInList } from "@/lib/admin-access";
import {
  getAdminAllowedEmails,
  getLocalAdminEnv,
  hasLocalAdminEnv,
  hasSupabasePublicEnv,
  hasSupabaseServiceRole,
} from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const LOCAL_ADMIN_COOKIE = "gym_admin_session";
export const MEMBER_LOGIN_PATH = "/acceso";

export interface LocalAdminUser {
  email: string;
  id: string;
  isLocalAdmin: true;
}

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

export function isAllowedAdminEmail(email: string | null | undefined) {
  return isAllowedAdminEmailInList(email, getAdminAllowedEmails());
}

export async function isLocalAdminSession() {
  if (!hasLocalAdminEnv()) {
    return false;
  }

  const adminEnv = getLocalAdminEnv();
  const cookieStore = await cookies();
  const localSession = cookieStore.get(LOCAL_ADMIN_COOKIE)?.value;

  return Boolean(adminEnv && localSession === adminEnv.user);
}

export async function getSupabaseUser() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch (error) {
    if (!isSupabaseAuthApiError(error)) {
      throw error;
    }

    console.warn(
      "Supabase auth could not be resolved while determining the current user.",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

export async function getCurrentMemberUser() {
  return getSupabaseUser();
}

export async function getCurrentAdminUser(): Promise<User | LocalAdminUser | null> {
  const supabaseUser = await getSupabaseUser();

  if (supabaseUser?.email && isAllowedAdminEmail(supabaseUser.email)) {
    return supabaseUser;
  }

  if (await isLocalAdminSession()) {
    const adminEnv = getLocalAdminEnv();
    if (adminEnv) {
      return {
        email: `${adminEnv.user} (local)`,
        id: `local-admin:${adminEnv.user}`,
        isLocalAdmin: true,
      };
    }
  }

  return null;
}

export async function requireMemberUser(redirectTo = MEMBER_LOGIN_PATH) {
  const user = await getCurrentMemberUser();

  if (!user) {
    redirect(redirectTo);
  }

  return user;
}

export async function requireAdminUser(redirectTo = `${ADMIN_LOGIN_PATH}?error=admin-only`) {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect(redirectTo);
  }

  return user;
}

export async function getDashboardCapabilities() {
  const localAdminSession = await isLocalAdminSession();
  const canManageRealData = hasSupabaseServiceRole();

  return {
    canManageRealData,
    isLocalReadOnly: localAdminSession && !canManageRealData,
    isReadOnly: !canManageRealData,
  };
}
