import { createClient } from "@supabase/supabase-js";

import { hasSupabaseSecretKey } from "@/lib/env";
import { getPublicSupabaseEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export const SUPERADMIN_ROLE = "superadmin";
export const DASHBOARD_ADMIN_ROLE = "admin";
export const TRAINER_ROLE = "trainer";
export const APP_BLOCKED_ROLE = "app_blocked";

export const DASHBOARD_STAFF_ROLES = [
  SUPERADMIN_ROLE,
  DASHBOARD_ADMIN_ROLE,
  TRAINER_ROLE,
] as const;

export const MOBILE_STAFF_ROLES = [
  SUPERADMIN_ROLE,
  DASHBOARD_ADMIN_ROLE,
  TRAINER_ROLE,
] as const;

export type PersistedUserRole =
  | typeof SUPERADMIN_ROLE
  | typeof DASHBOARD_ADMIN_ROLE
  | typeof TRAINER_ROLE
  | typeof APP_BLOCKED_ROLE;

type PersistedRoleRecord = Pick<
  Database["public"]["Tables"]["user_roles"]["Row"],
  "assigned_at" | "is_irreversible" | "note" | "role" | "user_id"
>;

function isPersistedUserRole(value: string): value is PersistedUserRole {
  return [
    SUPERADMIN_ROLE,
    DASHBOARD_ADMIN_ROLE,
    TRAINER_ROLE,
    APP_BLOCKED_ROLE,
  ].includes(value as PersistedUserRole);
}

function normalizeRoles(roles: string[]) {
  return [...new Set(roles.filter(isPersistedUserRole))];
}

export function isUserRolesSchemaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  return normalized.includes("user_roles") && (
    normalized.includes("does not exist") ||
    normalized.includes("relation") ||
    normalized.includes("schema cache") ||
    normalized.includes("could not find")
  );
}

export async function listUserRolesForServerSession(userId: string) {
  const supabase = hasSupabaseSecretKey()
    ? createSupabaseAdminClient()
    : await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return normalizeRoles((data ?? []).map((item) => item.role));
}

export async function listUserRolesForAccessToken(userId: string, accessToken: string) {
  const { url, anonKey } = getPublicSupabaseEnv();
  const supabase = createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return normalizeRoles((data ?? []).map((item) => item.role));
}

export async function hasTrainerRoleForServerSession(userId: string) {
  const roles = await listUserRolesForServerSession(userId);
  return roles.includes(TRAINER_ROLE);
}

export async function hasTrainerRoleForAccessToken(userId: string, accessToken: string) {
  const roles = await listUserRolesForAccessToken(userId, accessToken);
  return roles.includes(TRAINER_ROLE);
}

export async function hasAnyUserRoleForServerSession(
  userId: string,
  rolesToMatch: readonly PersistedUserRole[],
) {
  const roles = await listUserRolesForServerSession(userId);
  return rolesToMatch.some((role) => roles.includes(role));
}

export async function hasAnyUserRoleForAccessToken(
  userId: string,
  accessToken: string,
  rolesToMatch: readonly PersistedUserRole[],
) {
  const roles = await listUserRolesForAccessToken(userId, accessToken);
  return rolesToMatch.some((role) => roles.includes(role));
}

export async function countUsersWithRole(role: PersistedUserRole) {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("user_roles")
    .select("user_id", { count: "exact", head: true })
    .eq("role", role);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function listPersistedUserRoles() {
  /**
   * NOTA: Usa admin client porque se invoca durante el calculo del access state
   * del dashboard (evita dependencia circular).
   */
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, role, assigned_at, is_irreversible, note");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).filter((record) => isPersistedUserRole(record.role)) as PersistedRoleRecord[];
}

export async function listPersistedUserRolesForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, role, assigned_at, is_irreversible, note")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).filter((record) => isPersistedUserRole(record.role)) as PersistedRoleRecord[];
}
