import type { AuthUser as User } from "@/lib/auth-user";

import { hasSupabaseSecretKey } from "@/lib/env";
import { buildAuthUser } from "@/lib/auth-user";
import { listAllFirebaseUsers } from "@/lib/firebase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  APP_BLOCKED_ROLE,
  DASHBOARD_ADMIN_ROLE,
  SUPERADMIN_ROLE,
  isUserRolesSchemaError,
  listPersistedUserRoles,
  type PersistedUserRole,
  TRAINER_ROLE,
} from "@/lib/user-roles";

type MemberBridgeRecord = Pick<
  Database["public"]["Tables"]["member_commerce_customers"]["Row"],
  "email" | "medusa_customer_id" | "supabase_user_id"
>;

type MemberProfileRecord = Pick<
  Database["public"]["Tables"]["member_profiles"]["Row"],
  "email" | "id" | "status" | "supabase_user_id"
>;

type MobileAdminUser = {
  createdAt: string | null;
  email: string | null;
  hasAppAccess: boolean;
  hasDashboardAccess: boolean;
  hasMemberBridge: boolean;
  hasMemberProfile: boolean;
  id: string;
  lastSignInAt: string | null;
  medusaCustomerId: string | null;
  memberProfileId: string | null;
  memberStatus: string | null;
  roles: PersistedUserRole[];
};

export type MobileAdminSnapshot = {
  counts: {
    authUsers: number;
    dashboardAdmins: number;
    linkedMembers: number;
    pendingSetup: number;
    trainers: number;
  };
  trainerUsers: MobileAdminUser[];
  users: MobileAdminUser[];
  warnings: string[];
};

async function listAllAuthUsers() {
  const firebaseUsers = await listAllFirebaseUsers();

  return firebaseUsers.map((user) =>
    Object.assign(
      buildAuthUser({
        id: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        fullName: user.displayName,
        provider: user.providerData[0]?.providerId ?? "password",
      }),
      {
        created_at: user.metadata.creationTime ?? null,
        last_sign_in_at: user.metadata.lastSignInTime ?? null,
      },
    ),
  ) as Array<User & { created_at: string | null; last_sign_in_at: string | null }>;
}

async function listMemberBridgeRecords() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("member_commerce_customers")
    .select("email, medusa_customer_id, supabase_user_id");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MemberBridgeRecord[];
}

async function listMemberProfileRecords() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("member_profiles")
    .select("id, email, status, supabase_user_id");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MemberProfileRecord[];
}

function sortUsersByCreatedAt(users: MobileAdminUser[]) {
  return [...users].sort((left, right) => {
    const leftValue = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightValue = right.createdAt ? new Date(right.createdAt).getTime() : 0;

    return rightValue - leftValue;
  });
}

export async function getMobileAdminSnapshot(): Promise<MobileAdminSnapshot> {
  if (!hasSupabaseSecretKey()) {
    return {
      counts: {
        authUsers: 0,
        dashboardAdmins: 0,
        linkedMembers: 0,
        pendingSetup: 0,
        trainers: 0,
      },
      trainerUsers: [],
      users: [],
      warnings: [
        "Configura SUPABASE_SECRET_KEY para listar usuarios reales de la app mobile y sus roles persistentes.",
      ],
    };
  }

  const warnings: string[] = [];
  const [authUsersResult, rolesResult, bridgeResult, memberProfilesResult] = await Promise.allSettled([
    listAllAuthUsers(),
    listPersistedUserRoles(),
    listMemberBridgeRecords(),
    listMemberProfileRecords(),
  ]);

  if (authUsersResult.status === "rejected") {
    return {
      counts: {
        authUsers: 0,
        dashboardAdmins: 0,
        linkedMembers: 0,
        pendingSetup: 0,
        trainers: 0,
      },
      trainerUsers: [],
      users: [],
      warnings: [
        `No se pudieron leer los usuarios de Firebase Auth: ${authUsersResult.reason instanceof Error ? authUsersResult.reason.message : String(authUsersResult.reason)}`,
      ],
    };
  }

  if (rolesResult.status === "rejected") {
    warnings.push(
      isUserRolesSchemaError(rolesResult.reason)
        ? "La tabla `public.user_roles` aun no esta disponible. Se muestran usuarios Auth, pero los roles admin/trainer todavia no se pueden confirmar."
        : `No se pudieron leer los roles persistentes: ${rolesResult.reason instanceof Error ? rolesResult.reason.message : String(rolesResult.reason)}`,
    );
  }

  if (bridgeResult.status === "rejected") {
    warnings.push(
      `No se pudo leer el enlace de miembros mobile: ${bridgeResult.reason instanceof Error ? bridgeResult.reason.message : String(bridgeResult.reason)}`,
    );
  }

  if (memberProfilesResult.status === "rejected") {
    warnings.push(
      `No se pudieron leer las fichas de miembros: ${memberProfilesResult.reason instanceof Error ? memberProfilesResult.reason.message : String(memberProfilesResult.reason)}`,
    );
  }

  const roleRows = rolesResult.status === "fulfilled" ? rolesResult.value : [];
  const bridgeRows = bridgeResult.status === "fulfilled" ? bridgeResult.value : [];
  const memberProfileRows =
    memberProfilesResult.status === "fulfilled" ? memberProfilesResult.value : [];

  const rolesByUserId = new Map<string, PersistedUserRole[]>();
  for (const row of roleRows) {
    const roles = rolesByUserId.get(row.user_id) ?? [];
    roles.push(row.role as PersistedUserRole);
    rolesByUserId.set(row.user_id, [...new Set(roles)]);
  }

  const bridgeByUserId = new Map(bridgeRows.map((row) => [row.supabase_user_id, row]));
  const memberProfileByUserId = new Map(
    memberProfileRows
      .filter((row) => Boolean(row.supabase_user_id))
      .map((row) => [row.supabase_user_id, row]),
  );
  const users = sortUsersByCreatedAt(
    authUsersResult.value.map((user) => {
      const roles = rolesByUserId.get(user.id) ?? [];
      const memberBridge = bridgeByUserId.get(user.id);
      const memberProfile = memberProfileByUserId.get(user.id);

      return {
        createdAt: user.created_at ?? null,
        email: user.email ?? null,
        hasAppAccess: !roles.includes(APP_BLOCKED_ROLE),
        hasDashboardAccess:
          roles.includes(SUPERADMIN_ROLE) ||
          roles.includes(DASHBOARD_ADMIN_ROLE) ||
          roles.includes(TRAINER_ROLE),
        hasMemberBridge: Boolean(memberBridge),
        hasMemberProfile: Boolean(memberProfile),
        id: user.id,
        lastSignInAt: user.last_sign_in_at ?? null,
        medusaCustomerId: memberBridge?.medusa_customer_id ?? null,
        memberProfileId: memberProfile?.id ?? null,
        memberStatus: memberProfile?.status ?? null,
        roles,
      } satisfies MobileAdminUser;
    }),
  );

  const trainerUsers = users.filter((user) => user.roles.includes(TRAINER_ROLE));

  return {
    counts: {
      authUsers: users.length,
      dashboardAdmins: users.filter((user) =>
        user.roles.includes(SUPERADMIN_ROLE) || user.roles.includes(DASHBOARD_ADMIN_ROLE),
      ).length,
      linkedMembers: users.filter((user) => user.hasMemberProfile).length,
      pendingSetup: users.filter((user) => !user.roles.length || !user.hasMemberProfile).length,
      trainers: trainerUsers.length,
    },
    trainerUsers,
    users,
    warnings,
  };
}
