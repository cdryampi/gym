import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { ADMIN_LOGIN_PATH } from "@/lib/admin";
import type { AuthUser } from "@/lib/auth-user";
import {
  hasFirebaseAdminEnv,
  getLocalAdminEnv,
  hasLocalAdminEnv,
  hasSupabaseServiceRole,
} from "@/lib/env";
import { 
  getFirebaseUserFromIdToken,
  verifyFirebaseSessionToken 
} from "@/lib/firebase/server";
import {
  countUsersWithRole,
  SUPERADMIN_ROLE,
  DASHBOARD_ADMIN_ROLE,
  isUserRolesSchemaError,
  listUserRolesForServerSession,
  TRAINER_ROLE,
} from "@/lib/user-roles";

export const LOCAL_ADMIN_COOKIE = "gym_admin_session";
export const DASHBOARD_ROLE_OVERRIDE_COOKIE = "gym_e2e_dashboard_role";
export const FIREBASE_SESSION_COOKIE = "gym_firebase_session";
export const MEMBER_LOGIN_PATH = "/acceso";

export interface LocalAdminUser {
  email: string;
  id: string;
  isLocalAdmin: true;
}

export type DashboardAccessMode =
  | "superadmin"
  | "admin"
  | "trainer"
  | "bootstrap"
  | "local";

export interface DashboardAccessState {
  accessMode: DashboardAccessMode | null;
  accessWarning: string | null;
  user: AuthUser | LocalAdminUser | null;
}

type DashboardRoleOverride = Extract<DashboardAccessMode, "superadmin" | "admin" | "trainer">;

function resolveDashboardRoleOverride(input: string | undefined): DashboardRoleOverride | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  switch (input) {
    case "superadmin":
    case "admin":
    case "trainer":
      return input;
    default:
      return null;
  }
}

function createLocalAdminUser(user: string): LocalAdminUser {
  return {
    email: `${user} (local)`,
    id: `local-admin:${user}`,
    isLocalAdmin: true,
  };
}

/**
 * Verifica si la sesión actual es de un admin local (solo desarrollo).
 */
export const isLocalAdminSession = cache(async function isLocalAdminSession() {
  if (!hasLocalAdminEnv()) {
    return false;
  }

  const adminEnv = getLocalAdminEnv();
  const cookieStore = await cookies();
  const localSession = cookieStore.get(LOCAL_ADMIN_COOKIE)?.value;

  // IMPORTANTE: hasLocalAdminEnv ya garantiza que no sea produccion
  return Boolean(adminEnv && localSession === adminEnv.user);
});

/**
 * Obtiene el usuario autenticado validando el token de Firebase.
 * No confía en la simple presencia de la cookie.
 */
export const getAuthenticatedUser = cache(async function getAuthenticatedUser(): Promise<AuthUser | null> {
  if (process.env.VITEST_AUTH_MOCK === "true") return null;
  if (!hasFirebaseAdminEnv()) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(FIREBASE_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    // Validamos el token con Firebase Admin (firma) sin forzar check de revocacion para navegacion SSR
    const decodedToken = await verifyFirebaseSessionToken(sessionToken, false);
    
    // Si el token es valido, obtenemos el usuario completo (cached) pasando el token ya decodificado
    return await getFirebaseUserFromIdToken(sessionToken, decodedToken);
  } catch {
    // Si el token es invalido o expirado, no permitimos el acceso
    return null;
  }
});

export async function getCurrentMemberUser() {
  return getAuthenticatedUser();
}

const ADMIN_ALLOWED_EMAILS = process.env.ADMIN_ALLOWED_EMAILS?.split(",") || [];

async function canBootstrapDashboardAccess(userEmail?: string | null) {
  if (!hasSupabaseServiceRole()) {
    return false;
  }

  // Si se ha configurado una lista blanca, el usuario debe estar en ella para bootstrapear
  if (
    ADMIN_ALLOWED_EMAILS.length > 0 &&
    (!userEmail || !ADMIN_ALLOWED_EMAILS.includes(userEmail))
  ) {
    return false;
  }

  try {
    return (await countUsersWithRole(DASHBOARD_ADMIN_ROLE)) === 0;
  } catch (error) {
    if (isUserRolesSchemaError(error)) {
      return true;
    }

    return false;
  }
}

export const getDashboardAccessState = cache(
  async function getDashboardAccessState(): Promise<DashboardAccessState> {
  const cookieStore = await cookies();
  const roleOverride = resolveDashboardRoleOverride(
    cookieStore.get(DASHBOARD_ROLE_OVERRIDE_COOKIE)?.value,
  );
  
  const authenticatedUser = await getAuthenticatedUser();

  if (authenticatedUser?.id) {
    try {
      const roles = await listUserRolesForServerSession(authenticatedUser.id);

      if (
        roles.includes(SUPERADMIN_ROLE) ||
        roles.includes(DASHBOARD_ADMIN_ROLE) ||
        roles.includes(TRAINER_ROLE)
      ) {
        const accessMode =
          roles.includes(SUPERADMIN_ROLE)
            ? "superadmin"
            : roles.includes(DASHBOARD_ADMIN_ROLE)
              ? "admin"
              : "trainer";

        return {
          user: authenticatedUser,
          accessMode,
          accessWarning: null,
        };
      }

      if (await canBootstrapDashboardAccess(authenticatedUser.email)) {
        return {
          user: authenticatedUser,
          accessMode: "bootstrap",
          accessWarning:
            "El dashboard esta en modo bootstrap: todavia no existe ningun admin persistente en Supabase.",
        };
      }
    } catch (error) {
      if (isUserRolesSchemaError(error)) {
        const canBootstrap = ADMIN_ALLOWED_EMAILS.length === 0 || 
          (authenticatedUser.email && ADMIN_ALLOWED_EMAILS.includes(authenticatedUser.email));

        if (canBootstrap) {
          return {
            user: authenticatedUser,
            accessMode: "bootstrap",
            accessWarning: "Modo de acceso temporal activo. Configura roles de administrador en Supabase para desactivar este mensaje.",
          };
        }
      }
    }
  }

  if (await isLocalAdminSession()) {
    const adminEnv = getLocalAdminEnv();
    if (adminEnv) {
      return {
        user: createLocalAdminUser(adminEnv.user),
        accessMode: roleOverride || "local",
        accessWarning: null,
      };
    }
  }

  return {
    user: null,
    accessMode: null,
    accessWarning: null,
  };
  },
);

export async function requireAuthenticatedUser(redirectTo = "/acceso") {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}


export async function requireAdminUser(redirectTo = `${ADMIN_LOGIN_PATH}?error=admin-only`) {
  const accessState = await getDashboardAccessState();

  if (!accessState.user || !accessState.accessMode) {
    redirect(redirectTo);
  }

  return accessState.user;
}

export async function requireSuperadminUser(
  redirectTo = `${ADMIN_LOGIN_PATH}?error=admin-only`,
) {
  const accessState = await getDashboardAccessState();

  if (!accessState.user || accessState.accessMode !== "superadmin") {
    redirect(redirectTo);
  }

  return accessState.user;
}

export async function requireDashboardAccessModes(
  allowedModes: DashboardAccessMode[],
  redirectTo = `${ADMIN_LOGIN_PATH}?error=admin-only`,
) {
  const accessState = await getDashboardAccessState();

  if (!accessState.user || !accessState.accessMode || !allowedModes.includes(accessState.accessMode)) {
    redirect(redirectTo);
  }

  return accessState;
}

export const getDashboardCapabilities = cache(async function getDashboardCapabilities() {
  const accessState = await getDashboardAccessState();
  const canManageRealData = hasSupabaseServiceRole();

  return {
    canManageRealData,
    accessMode: accessState.accessMode,
    accessWarning: accessState.accessWarning,
    isBootstrap: accessState.accessMode === "bootstrap",
    isSuperadmin: accessState.accessMode === "superadmin",
    isLocalReadOnly: accessState.accessMode === "local" && !canManageRealData,
    isReadOnly: !canManageRealData,
  };
});
