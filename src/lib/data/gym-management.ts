import type { AuthUser as User } from "@/lib/auth-user";

import {
  AssignRoutineInputSchema,
  MemberPlanSnapshotDtoSchema,
  MemberStatusDtoSchema,
  RoutineDetailDtoSchema,
  RoutineSummaryDtoSchema,
  RoutineTemplateDtoSchema,
  RoutineTemplateListItemDtoSchema,
  TrainingFeedbackDtoSchema,
  UpdateExerciseFeedbackInputSchema,
  UpdateRoutineFeedbackInputSchema,
  type AssignRoutineInput,
  type AssignRoutineResponse,
  type MemberHistoryResponse,
  type MemberPlanSnapshotDto,
  type MemberSummaryDto,
  type MobileRole,
  type MobileStaffAccessLevel,
  type MobileSession,
  type RoutineAssignmentDto,
  type RoutineDetailDto,
  type RoutineTemplateDto,
  type RoutineTemplateListItemDto,
  type StaffDashboardDto,
  type StaffMemberDetailDto,
  type StaffMemberListItemDto,
  type TrainingFeedbackDto,
  type UpdateExerciseFeedbackInput,
  type UpdateRoutineFeedbackInput,
} from "@mobile-contracts";

import {
  memberFormSchema,
  memberMobilePatchSchema,
  type MemberFormValues,
  type MemberMobilePatchValues,
} from "@/lib/validators/gym-members";
import { buildAuthUser } from "@/lib/auth-user";
import { getFirebaseAdminAuth, listAllFirebaseUsers } from "@/lib/firebase/server";
import {
  assignRoutineFormSchema,
  routineTemplateFormSchema,
  type RoutineTemplateFormValues,
} from "@/lib/validators/gym-routines";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  Database,
  DBMemberPlanSnapshot,
  DBMemberProfile,
  DBMemberRoutineExerciseFeedback,
  DBMemberRoutineFeedback,
  DBRoutineAssignment,
  DBRoutineTemplate,
  DBRoutineTemplateBlock,
  DBRoutineTemplateExercise,
  DBTrainerProfile,
} from "@/lib/supabase/database.types";
import {
  DASHBOARD_ADMIN_ROLE,
  SUPERADMIN_ROLE,
  TRAINER_ROLE,
  listPersistedUserRoles,
  listPersistedUserRolesForUser,
  type PersistedUserRole,
} from "@/lib/user-roles";
import {
  getMemberFinancials,
  getMemberMeasurements,
  type MemberMeasurementDto,
  type MembershipDto,
} from "@/lib/data/member-finance";
import { normalizeMembershipQrToken } from "@/lib/membership-qr";
import { slugify, trimToNull } from "@/lib/utils";

type GymAdminClient = ReturnType<typeof createSupabaseAdminClient>;
type FirebaseAdminAuth = ReturnType<typeof getFirebaseAdminAuth>;

type AuthDashboardUser = {
  createdAt: string | null;
  displayName: string;
  email: string | null;
  id: string;
  lastSignInAt: string | null;
  roles: PersistedUserRole[];
};

type MemberDeleteCandidate = {
  id: string;
  supabase_user_id: string | null;
};

const PROTECTED_MEMBER_AUTH_ROLES = new Set<PersistedUserRole>([
  SUPERADMIN_ROLE,
  DASHBOARD_ADMIN_ROLE,
  TRAINER_ROLE,
]);

export type TrainerOption = {
  branchName: string | null;
  displayName: string;
  email: string;
  isActive: boolean;
  userId: string;
};

export type AuthLinkOption = {
  displayName: string;
  email: string;
  id: string;
};

export type DashboardMemberListItem = MemberSummaryDto & {
  activeRoutineId: string | null;
  linkedUserEmail: string | null;
  linkedUserId: string | null;
  phone: string | null;
  trainerName: string | null;
  trainerUserId: string | null;
  updatedAt: string;
  // Legacy fields from Phase 1
  externalCode: string | null;
  birthDate: string | null;
  gender: string | null;
  address: string | null;
  districtOrUrbanization: string | null;
  occupation: string | null;
  preferredSchedule: string | null;
  legacyNotes: string | null;
  profileCompleted: boolean;
};

export type DashboardMemberDetail = {
  assignmentHistory: RoutineAssignmentDto[];
  availableTemplates: RoutineTemplateListItemDto[];
  linkedUser: AuthLinkOption | null;
  member: DashboardMemberListItem;
  notes: string | null;
  plan: MemberPlanSnapshotDto | null;
  trainingFeedback: TrainingFeedbackDto;
  statusMeta: {
    helperText: string;
    label: string;
  };
  financials: MembershipDto | null;
  measurements: MemberMeasurementDto[];
};

export type DashboardRoutineTemplateListItem = RoutineTemplateListItemDto & {
  assignedMembers: number;
  isActive: boolean;
};

export type DashboardAssignedMemberRow = {
  assignedAt: string;
  assignmentId: string;
  memberId: string;
  memberName: string;
  planLabel: string;
  status: string;
};

export type DashboardRoutineTemplateDetail = {
  assignedMembers: DashboardAssignedMemberRow[];
  isActive: boolean;
  template: RoutineTemplateDto;
  trainerUserId: string | null;
};

type ActiveRoutineFeedback = {
  assignment: DBRoutineAssignment;
  exerciseFeedback: DBMemberRoutineExerciseFeedback[];
  routineFeedback: DBMemberRoutineFeedback | null;
};

function getDisplayNameFromEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase() ?? "";
  const localPart = normalized.split("@")[0] ?? "usuario";

  return localPart
    .split(/[._+\-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getUserDisplayName(user: Pick<User, "app_metadata" | "email" | "user_metadata">) {
  const metadataName =
    typeof user.app_metadata?.full_name === "string"
      ? user.app_metadata.full_name.trim()
      : "";
  const userMetadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";

  return metadataName || userMetadataName || getDisplayNameFromEmail(user.email);
}

function getMemberStatusHelper(status: MemberSummaryDto["status"]) {
  switch (status) {
    case "active":
      return "Ficha operativa y lista para consumo mobile.";
    case "paused":
      return "Miembro pausado temporalmente, revisa plan y seguimiento.";
    case "cancelled":
      return "Ficha cancelada; no deberia recibir nuevas asignaciones.";
    case "former":
      return "Miembro historico sin actividad actual.";
    case "prospect":
    default:
      return "Pendiente de completar alta y plan operativo.";
  }
}

function getAssignmentStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Completada";
    case "archived":
      return "Archivada";
    case "active":
    default:
      return "Activa";
  }
}

export function generateMemberNumber() {
  return `NF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function normalizeMemberEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function ensureMemberProfileQrToken(
  client: GymAdminClient,
  member: DBMemberProfile,
): Promise<DBMemberProfile> {
  const currentToken = normalizeMembershipQrToken(member.membership_qr_token);

  if (currentToken) {
    return member;
  }

  const nextToken = crypto.randomUUID();
  const { error } = await client
    .from("member_profiles")
    .update({ membership_qr_token: nextToken })
    .eq("id", member.id);

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...member,
    membership_qr_token: nextToken,
  };
}

function resolveRoutineTemplateSlug(title: string, existingSlug?: string | null) {
  const normalizedExisting = trimToNull(existingSlug);

  if (normalizedExisting) {
    return normalizedExisting;
  }

  return slugify(title) || `rutina-${crypto.randomUUID().slice(0, 8)}`;
}

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

async function getAuthUserById(userId: string) {
  const user = await getFirebaseAdminAuth().getUser(userId);

  return buildAuthUser({
    id: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    fullName: user.displayName,
    provider: user.providerData[0]?.providerId ?? "password",
  });
}

function isFirebaseUserNotFoundError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message).toLowerCase() : "";

  return code === "auth/user-not-found" || message.includes("user-not-found");
}

async function resolveMemberAuthDeleteCandidate(
  auth: FirebaseAdminAuth,
  member: MemberDeleteCandidate,
) {
  if (!member.supabase_user_id) {
    return null;
  }

  try {
    return await auth.getUser(member.supabase_user_id);
  } catch (error) {
    if (isFirebaseUserNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

async function hasProtectedMemberAuthRole(userId: string) {
  const roles = await listPersistedUserRolesForUser(userId);
  return roles.some((role) => PROTECTED_MEMBER_AUTH_ROLES.has(role.role as PersistedUserRole));
}

async function cleanupDeletedMemberAuthReferences(client: GymAdminClient, userId: string) {
  const { error: pickupRequestError } = await client
    .from("pickup_request")
    .update({ supabase_user_id: null })
    .eq("supabase_user_id", userId);

  if (pickupRequestError) {
    throw new Error(pickupRequestError.message);
  }

  const { error: membershipRequestError } = await client
    .from("membership_requests")
    .update({ supabase_user_id: null })
    .eq("supabase_user_id", userId);

  if (membershipRequestError) {
    throw new Error(membershipRequestError.message);
  }

  const { error: bridgeError } = await client
    .from("member_commerce_customers")
    .delete()
    .eq("supabase_user_id", userId);

  if (bridgeError) {
    throw new Error(bridgeError.message);
  }

  const { error: userRolesError } = await client.from("user_roles").delete().eq("user_id", userId);

  if (userRolesError) {
    throw new Error(userRolesError.message);
  }

  const { error: trainerProfileError } = await client
    .from("trainer_profiles")
    .delete()
    .eq("user_id", userId);

  if (trainerProfileError) {
    throw new Error(trainerProfileError.message);
  }
}

async function deleteMemberAuthUserIfAllowed(client: GymAdminClient, member: MemberDeleteCandidate) {
  const auth = getFirebaseAdminAuth();
  const authCandidate = await resolveMemberAuthDeleteCandidate(auth, member);

  if (!authCandidate || (await hasProtectedMemberAuthRole(authCandidate.uid))) {
    return;
  }

  // Primero liberamos Firebase para asegurar que el re-registro sea posible
  await auth.deleteUser(authCandidate.uid);
  // Luego limpiamos referencias cruzadas en Supabase vinculadas al UID de Firebase
  await cleanupDeletedMemberAuthReferences(client, authCandidate.uid);
}

async function cleanupMemberOperationalData(client: GymAdminClient, memberId: string) {
  const { error: planError } = await client
    .from("member_plan_snapshots")
    .delete()
    .eq("member_id", memberId);

  if (planError) {
    throw new Error(planError.message);
  }

  const { error: routineFeedbackError } = await client
    .from("member_routine_feedback")
    .delete()
    .eq("member_id", memberId);

  if (routineFeedbackError) {
    throw new Error(routineFeedbackError.message);
  }

  const { error: exerciseFeedbackError } = await client
    .from("member_routine_exercise_feedback")
    .delete()
    .eq("member_id", memberId);

  if (exerciseFeedbackError) {
    throw new Error(exerciseFeedbackError.message);
  }

  const { data: assignments, error: assignmentsError } = await client
    .from("routine_assignments")
    .select("id")
    .eq("member_id", memberId);

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  if (assignments && assignments.length > 0) {
    const assignmentIds = assignments.map((a) => a.id);
    const { error: assignmentFeedbackError } = await client
      .from("member_routine_feedback")
      .delete()
      .in("routine_assignment_id", assignmentIds);

    if (assignmentFeedbackError) {
      throw new Error(assignmentFeedbackError.message);
    }

    const { error: assignmentExerciseFeedbackError } = await client
      .from("member_routine_exercise_feedback")
      .delete()
      .in("routine_assignment_id", assignmentIds);

    if (assignmentExerciseFeedbackError) {
      throw new Error(assignmentExerciseFeedbackError.message);
    }

    const { error: assignmentsDeleteError } = await client
      .from("routine_assignments")
      .delete()
      .eq("member_id", memberId);

    if (assignmentsDeleteError) {
      throw new Error(assignmentsDeleteError.message);
    }
  }
}

async function listAuthUsersWithRoles(): Promise<AuthDashboardUser[]> {
  const [users, roleRows] = await Promise.all([listAllAuthUsers(), listPersistedUserRoles()]);
  const rolesByUserId = new Map<string, PersistedUserRole[]>();

  for (const row of roleRows) {
    const current = rolesByUserId.get(row.user_id) ?? [];
    current.push(row.role as PersistedUserRole);
    rolesByUserId.set(row.user_id, [...new Set(current)]);
  }

  return users
    .map((user) => ({
      createdAt: user.created_at ?? null,
      displayName: getUserDisplayName(user),
      email: user.email ?? null,
      id: user.id,
      lastSignInAt: user.last_sign_in_at ?? null,
      roles: rolesByUserId.get(user.id) ?? [],
    }))
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
}

async function listTrainerProfiles(client: GymAdminClient) {
  const { data, error } = await client
    .from("trainer_profiles")
    .select("user_id, display_name, branch_name, bio, is_active, created_at, updated_at");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DBTrainerProfile[];
}

async function listMemberProfiles(
  client: GymAdminClient,
  options?: { search?: string; status?: string },
) {
  let query = client
    .from("member_profiles")
    .select(
      "id, supabase_user_id, trainer_user_id, member_number, full_name, email, phone, status, branch_name, notes, join_date, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  } else {
    // Hide archived members from default active listing
    query = query.neq("status", "former");
  }

  if (options?.search?.trim()) {
    const normalized = options.search.trim();
    // Escape special PostgREST characters to prevent parsing errors
    const escaped = normalized.replace(/,/g, "\\,").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    query = query.or(
      `full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,member_number.ilike.%${escaped}%,external_code.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DBMemberProfile[];
}

export async function getMemberProfileById(client: GymAdminClient, memberId: string) {
  const { data, error } = await client
    .from("member_profiles")
    .select(
      "id, supabase_user_id, trainer_user_id, member_number, full_name, email, phone, status, branch_name, notes, join_date, created_at, updated_at",
    )
    .eq("id", memberId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as DBMemberProfile | null;
}

async function getMemberProfileBySupabaseUserId(client: GymAdminClient, userId: string) {
  const { data, error } = await client
    .from("member_profiles")
    .select(
      "id, supabase_user_id, trainer_user_id, member_number, full_name, email, phone, status, branch_name, notes, join_date, created_at, updated_at",
    )
    .eq("supabase_user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as DBMemberProfile | null;
}

async function listMemberProfilesByEmail(client: GymAdminClient, email: string) {
  const { data, error } = await client
    .from("member_profiles")
    .select(
      "id, supabase_user_id, trainer_user_id, member_number, full_name, email, phone, status, branch_name, notes, join_date, created_at, updated_at",
    )
    .eq("email", normalizeMemberEmail(email))
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DBMemberProfile[];
}

function getMemberOperationalScore(
  member: DBMemberProfile,
  {
    assignmentCount,
    hasActiveAssignment,
    hasCurrentPlan,
    isLinkedToUser,
  }: {
    assignmentCount: number;
    hasActiveAssignment: boolean;
    hasCurrentPlan: boolean;
    isLinkedToUser: boolean;
  },
) {
  let score = 0;

  if (hasActiveAssignment) {
    score += 100;
  }

  if (assignmentCount > 0) {
    score += 15;
  }

  if (hasCurrentPlan) {
    score += 25;
  }

  if (isLinkedToUser) {
    score += 10;
  }

  switch (member.status) {
    case "active":
      score += 40;
      break;
    case "paused":
      score += 25;
      break;
    case "former":
    case "cancelled":
      score += 10;
      break;
    case "prospect":
    default:
      break;
  }

  return score;
}

export async function ensureMemberProfileForUser(user: Pick<User, "app_metadata" | "email" | "id" | "user_metadata">) {
  if (!user.email) {
    throw new Error("El usuario autenticado no tiene un email valido para crear la ficha.");
  }

  const client = createSupabaseAdminClient();
  const normalizedEmail = normalizeMemberEmail(user.email);
  const linkedMember = await getMemberProfileBySupabaseUserId(client, user.id);
  const emailMatches = await listMemberProfilesByEmail(client, normalizedEmail);
  const candidateMap = new Map<string, DBMemberProfile>();

  if (linkedMember) {
    candidateMap.set(linkedMember.id, linkedMember);
  }

  for (const member of emailMatches) {
    if (member.supabase_user_id && member.supabase_user_id !== user.id) {
      continue;
    }

    candidateMap.set(member.id, member);
  }

  const candidates = [...candidateMap.values()];

  if (candidates.length > 0) {
    const memberIds = candidates.map((member) => member.id);
    const [plans, assignments] = await Promise.all([
      listCurrentPlans(client, memberIds),
      listAssignments(client, memberIds),
    ]);
    const planMemberIds = new Set(plans.map((plan) => plan.member_id));
    const assignmentsByMemberId = new Map<string, DBRoutineAssignment[]>();

    for (const assignment of assignments) {
      const current = assignmentsByMemberId.get(assignment.member_id) ?? [];
      current.push(assignment);
      assignmentsByMemberId.set(assignment.member_id, current);
    }

    const selectedMember = [...candidates].sort((left, right) => {
      const leftAssignments = assignmentsByMemberId.get(left.id) ?? [];
      const rightAssignments = assignmentsByMemberId.get(right.id) ?? [];
      const leftScore = getMemberOperationalScore(left, {
        assignmentCount: leftAssignments.length,
        hasActiveAssignment: leftAssignments.some((assignment) => assignment.status === "active"),
        hasCurrentPlan: planMemberIds.has(left.id),
        isLinkedToUser: left.supabase_user_id === user.id,
      });
      const rightScore = getMemberOperationalScore(right, {
        assignmentCount: rightAssignments.length,
        hasActiveAssignment: rightAssignments.some((assignment) => assignment.status === "active"),
        hasCurrentPlan: planMemberIds.has(right.id),
        isLinkedToUser: right.supabase_user_id === user.id,
      });

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      return left.created_at.localeCompare(right.created_at);
    })[0];

    if (linkedMember && linkedMember.id !== selectedMember.id) {
      const { error: unlinkError } = await client
        .from("member_profiles")
        .update({ supabase_user_id: null })
        .eq("id", linkedMember.id);

      if (unlinkError) {
        throw new Error(unlinkError.message);
      }
    }

    if (selectedMember.supabase_user_id !== user.id) {
      const { error: relinkError } = await client
        .from("member_profiles")
        .update({ supabase_user_id: user.id })
        .eq("id", selectedMember.id);

      if (relinkError) {
        throw new Error(relinkError.message);
      }

      return ensureMemberProfileQrToken(client, {
        ...selectedMember,
        supabase_user_id: user.id,
      });
    }

    return ensureMemberProfileQrToken(client, selectedMember);
  }

  const today = new Date().toISOString().slice(0, 10);
  const newMemberNumber = generateMemberNumber();
  const { data, error } = await client
    .from("member_profiles")
    .insert({
      branch_name: null,
      email: normalizedEmail,
      external_code: newMemberNumber, // Default to member_number for new profiles
      full_name: getUserDisplayName(user),
      join_date: today,
      member_number: newMemberNumber,
      notes: null,
      phone: null,
      status: "prospect",
      supabase_user_id: user.id,
      trainer_user_id: null,
    })
    .select(
      "id, supabase_user_id, trainer_user_id, member_number, full_name, email, phone, status, branch_name, notes, join_date, created_at, updated_at",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return ensureMemberProfileQrToken(client, data as DBMemberProfile);
}

async function listCurrentPlans(client: GymAdminClient, memberIds: string[]) {
  if (memberIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("member_plan_snapshots")
    .select("id, member_id, label, status, started_at, ends_at, notes, is_current, created_at, updated_at")
    .in("member_id", memberIds)
    .eq("is_current", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DBMemberPlanSnapshot[];
}

async function listAssignments(client: GymAdminClient, memberIds: string[]) {
  if (memberIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("routine_assignments")
    .select(
      "id, member_id, routine_template_id, trainer_user_id, assigned_by_user_id, notes, starts_on, ends_on, assigned_at, status, recommended_schedule_label, created_at, updated_at",
    )
    .in("member_id", memberIds)
    .order("assigned_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DBRoutineAssignment[];
}

async function listRoutineFeedbackByAssignments(client: GymAdminClient, assignmentIds: string[]) {
  if (assignmentIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("member_routine_feedback")
    .select("id, member_id, routine_assignment_id, liked, note, created_at, updated_at")
    .in("routine_assignment_id", assignmentIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DBMemberRoutineFeedback[];
}

async function listExerciseFeedbackByAssignments(client: GymAdminClient, assignmentIds: string[]) {
  if (assignmentIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("member_routine_exercise_feedback")
    .select(
      "id, member_id, routine_assignment_id, routine_template_exercise_id, liked, note, created_at, updated_at",
    )
    .in("routine_assignment_id", assignmentIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DBMemberRoutineExerciseFeedback[];
}

async function listTemplates(client: GymAdminClient, templateIds?: string[]) {
  let query = client
    .from("routine_templates")
    .select(
      "id, trainer_user_id, created_by, slug, title, goal, summary, notes, duration_label, difficulty_label, intensity_label, status_label, is_active, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (templateIds?.length) {
    query = query.in("id", templateIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DBRoutineTemplate[];
}

async function getTemplateById(client: GymAdminClient, templateId: string) {
  const { data, error } = await client
    .from("routine_templates")
    .select(
      "id, trainer_user_id, created_by, slug, title, goal, summary, notes, duration_label, difficulty_label, intensity_label, status_label, is_active, created_at, updated_at",
    )
    .eq("id", templateId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as DBRoutineTemplate | null;
}

async function listBlocks(client: GymAdminClient, templateIds: string[]) {
  if (templateIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("routine_template_blocks")
    .select("id, routine_template_id, title, description, sort_order, created_at, updated_at")
    .in("routine_template_id", templateIds)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DBRoutineTemplateBlock[];
}

async function listExercises(client: GymAdminClient, blockIds: string[]) {
  if (blockIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("routine_template_exercises")
    .select("id, routine_block_id, name, sets_label, reps_label, rest_seconds, notes, sort_order, created_at, updated_at")
    .in("routine_block_id", blockIds)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DBRoutineTemplateExercise[];
}

async function getActiveAssignmentForMember(client: GymAdminClient, memberId: string) {
  const assignments = await listAssignments(client, [memberId]);
  return assignments.find((assignment) => assignment.status === "active") ?? null;
}

function mapPlanSnapshot(plan: DBMemberPlanSnapshot | null | undefined): MemberPlanSnapshotDto | null {
  if (!plan) {
    return null;
  }

  return MemberPlanSnapshotDtoSchema.parse({
    id: plan.id,
    label: plan.label,
    status: plan.status,
    startedAt: plan.started_at,
    endsAt: plan.ends_at,
    notes: plan.notes,
  });
}

function buildTemplateCounts(
  templates: DBRoutineTemplate[],
  blocks: DBRoutineTemplateBlock[],
  exercises: DBRoutineTemplateExercise[],
) {
  const blockCountByTemplate = new Map<string, number>();
  const exerciseCountByTemplate = new Map<string, number>();
  const templateIdByBlockId = new Map<string, string>();

  for (const template of templates) {
    blockCountByTemplate.set(template.id, 0);
    exerciseCountByTemplate.set(template.id, 0);
  }

  for (const block of blocks) {
    templateIdByBlockId.set(block.id, block.routine_template_id);
    blockCountByTemplate.set(
      block.routine_template_id,
      (blockCountByTemplate.get(block.routine_template_id) ?? 0) + 1,
    );
  }

  for (const exercise of exercises) {
    const templateId = templateIdByBlockId.get(exercise.routine_block_id);

    if (!templateId) {
      continue;
    }

    exerciseCountByTemplate.set(
      templateId,
      (exerciseCountByTemplate.get(templateId) ?? 0) + 1,
    );
  }

  return { blockCountByTemplate, exerciseCountByTemplate };
}

function mapRoutineTemplateListItem(
  template: DBRoutineTemplate,
  {
    blockCount = 0,
    exerciseCount = 0,
    trainerName = null,
  }: {
    blockCount?: number;
    exerciseCount?: number;
    trainerName?: string | null;
  } = {},
): RoutineTemplateListItemDto {
  return RoutineTemplateListItemDtoSchema.parse({
    blockCount,
    difficultyLabel: template.difficulty_label,
    durationLabel: template.duration_label,
    exerciseCount,
    goal: template.goal,
    id: template.id,
    intensityLabel: template.intensity_label,
    statusLabel: template.status_label,
    summary: template.summary,
    title: template.title,
    trainerName,
    updatedAt: template.updated_at,
  });
}

function mapRoutineTemplateDetail(
  template: DBRoutineTemplate,
  trainerName: string | null,
  blocks: DBRoutineTemplateBlock[],
  exercises: DBRoutineTemplateExercise[],
): RoutineTemplateDto {
  const exercisesByBlock = new Map<string, DBRoutineTemplateExercise[]>();

  for (const exercise of exercises) {
    const current = exercisesByBlock.get(exercise.routine_block_id) ?? [];
    current.push(exercise);
    exercisesByBlock.set(exercise.routine_block_id, current);
  }

  return RoutineTemplateDtoSchema.parse({
    ...RoutineSummaryDtoSchema.parse({
      id: template.id,
      title: template.title,
      goal: template.goal,
      summary: template.summary,
      durationLabel: template.duration_label,
      intensityLabel: template.intensity_label,
      statusLabel: template.status_label,
      heroImageUrl: null,
    }),
    blockCount: blocks.length,
    blocks: blocks
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((block) => ({
        id: block.id,
        title: block.title,
        description: block.description,
        exercises: (exercisesByBlock.get(block.id) ?? [])
          .sort((left, right) => left.sort_order - right.sort_order)
          .map((exercise) => ({
            id: exercise.id,
            liked: false,
            memberNote: null,
            name: exercise.name,
            notes: exercise.notes,
            reps: exercise.reps_label,
            restSeconds: exercise.rest_seconds,
            sets: exercise.sets_label,
          })),
      })),
    difficultyLabel: template.difficulty_label,
    exerciseCount: exercises.length,
    notes: template.notes,
    slug: template.slug,
    trainerName,
    updatedAt: template.updated_at,
  });
}

function mapRoutineAssignment(
  assignment: DBRoutineAssignment,
  templateTitle: string,
  trainerName: string | null,
): RoutineAssignmentDto {
  return {
    id: assignment.id,
    memberId: assignment.member_id,
    templateId: assignment.routine_template_id,
    templateTitle,
    assignedAt: assignment.assigned_at,
    startsOn: assignment.starts_on,
    endsOn: assignment.ends_on,
    status: assignment.status as RoutineAssignmentDto["status"],
    notes: assignment.notes,
    trainerName,
  };
}

function buildTrainingFeedback(
  activeFeedback: ActiveRoutineFeedback | null,
  exercises: DBRoutineTemplateExercise[],
): TrainingFeedbackDto {
  if (!activeFeedback) {
    return TrainingFeedbackDtoSchema.parse({
      exercises: [],
      routine: null,
    });
  }

  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));

  return TrainingFeedbackDtoSchema.parse({
    exercises: activeFeedback.exerciseFeedback
      .map((feedback) => ({
        exerciseId: feedback.routine_template_exercise_id,
        exerciseName: exerciseById.get(feedback.routine_template_exercise_id)?.name ?? "Ejercicio",
        liked: feedback.liked,
        note: feedback.note,
      }))
      .sort((left, right) => left.exerciseName.localeCompare(right.exerciseName)),
    routine: activeFeedback.routineFeedback
      ? {
          liked: activeFeedback.routineFeedback.liked,
          note: activeFeedback.routineFeedback.note,
        }
      : {
          liked: false,
          note: null,
        },
  });
}

async function getActiveRoutineFeedback(
  client: GymAdminClient,
  memberId: string,
): Promise<ActiveRoutineFeedback | null> {
  const assignment = await getActiveAssignmentForMember(client, memberId);

  if (!assignment) {
    return null;
  }

  const [routineFeedbackRows, exerciseFeedbackRows] = await Promise.all([
    listRoutineFeedbackByAssignments(client, [assignment.id]),
    listExerciseFeedbackByAssignments(client, [assignment.id]),
  ]);

  return {
    assignment,
    exerciseFeedback: exerciseFeedbackRows.filter((feedback) => feedback.member_id === memberId),
    routineFeedback:
      routineFeedbackRows.find((feedback) => feedback.member_id === memberId) ?? null,
  };
}

function mapRoutineDetail(
  template: DBRoutineTemplate,
  assignment: DBRoutineAssignment,
  trainerName: string | null,
  blocks: DBRoutineTemplateBlock[],
  exercises: DBRoutineTemplateExercise[],
  routineFeedback: DBMemberRoutineFeedback | null,
  exerciseFeedback: DBMemberRoutineExerciseFeedback[],
): RoutineDetailDto {
  const exerciseFeedbackById = new Map(
    exerciseFeedback.map((feedback) => [feedback.routine_template_exercise_id, feedback]),
  );
  const templateDetail = mapRoutineTemplateDetail(template, trainerName, blocks, exercises);

  return RoutineDetailDtoSchema.parse({
    ...templateDetail,
    assignedAt: assignment.assigned_at,
    blocks: templateDetail.blocks.map((block) => ({
      ...block,
      exercises: block.exercises.map((exercise) => {
        const feedback = exerciseFeedbackById.get(exercise.id);
        return {
          ...exercise,
          liked: feedback?.liked ?? false,
          memberNote: feedback?.note ?? null,
        };
      }),
    })),
    endsOn: assignment.ends_on,
    liked: routineFeedback?.liked ?? false,
    memberNote: routineFeedback?.note ?? null,
    recommendedScheduleLabel: assignment.recommended_schedule_label ?? null,
    startsOn: assignment.starts_on,
    trainerName,
  });
}

function mapMemberSummary(
  member: DBMemberProfile,
  plan: DBMemberPlanSnapshot | null | undefined,
  activeRoutineTitle: string | null,
): MemberSummaryDto {
  return {
    id: member.id,
    memberNumber: member.member_number,
    fullName: member.full_name,
    email: member.email,
    status: member.status as MemberSummaryDto["status"],
    planLabel: plan?.label ?? "Sin plan",
    joinDate: member.join_date,
    branchName: member.branch_name,
    currentRoutineTitle: activeRoutineTitle,
    nextActionLabel: activeRoutineTitle ? "Ver rutina activa" : "Asignar rutina",
  };
}

async function buildSharedDomainContext(memberIds: string[]) {
  const client = createSupabaseAdminClient();
  const [plans, assignments, templates, trainerProfiles, authUsers] = await Promise.all([
    listCurrentPlans(client, memberIds),
    listAssignments(client, memberIds),
    listTemplates(client),
    listTrainerProfiles(client),
    listAuthUsersWithRoles(),
  ]);

  return {
    assignments,
    authUsers,
    plans,
    templates,
    trainerProfiles,
  };
}

function buildTrainerMaps(
  authUsers: AuthDashboardUser[],
  trainerProfiles: DBTrainerProfile[],
) {
  const authById = new Map(authUsers.map((user) => [user.id, user]));
  const trainerProfileById = new Map(trainerProfiles.map((profile) => [profile.user_id, profile]));
  const trainerNameById = new Map<string, string>();
  const trainerOptions: TrainerOption[] = [];

  for (const user of authUsers.filter((candidate) => candidate.roles.includes(TRAINER_ROLE))) {
    const profile = trainerProfileById.get(user.id);
    const email = user.email ?? `${user.id}@invalid.local`;
    const displayName =
      profile?.display_name?.trim() || user.displayName || getDisplayNameFromEmail(email);

    trainerNameById.set(user.id, displayName);
    trainerOptions.push({
      branchName: profile?.branch_name ?? null,
      displayName,
      email,
      isActive: profile?.is_active ?? true,
      userId: user.id,
    });
  }

  return {
    authById,
    trainerNameById,
    trainerOptions: trainerOptions.sort((left, right) => left.displayName.localeCompare(right.displayName)),
  };
}

export async function listDashboardAuthLinkOptions() {
  const authUsers = await listAuthUsersWithRoles();

  return authUsers
    .filter((user) => Boolean(user.email))
    .map((user) => ({
      displayName: user.displayName,
      email: user.email!,
      id: user.id,
    }))
    .sort((left, right) => left.displayName.localeCompare(right.displayName));
}

export async function listDashboardTrainerOptions() {
  const client = createSupabaseAdminClient();
  const [authUsers, trainerProfiles] = await Promise.all([
    listAuthUsersWithRoles(),
    listTrainerProfiles(client),
  ]);

  return buildTrainerMaps(authUsers, trainerProfiles).trainerOptions;
}

export async function listDashboardMembers(options?: { search?: string; status?: string }) {
  const client = createSupabaseAdminClient();
  const members = await listMemberProfiles(client, options);
  const memberIds = members.map((member) => member.id);
  const { assignments, authUsers, plans, templates, trainerProfiles } = await buildSharedDomainContext(
    memberIds,
  );
  const currentPlansByMemberId = new Map(plans.map((plan) => [plan.member_id, plan]));
  const activeAssignmentsByMemberId = new Map(
    assignments
      .filter((assignment) => assignment.status === "active")
      .map((assignment) => [assignment.member_id, assignment]),
  );
  const templateById = new Map(templates.map((template) => [template.id, template]));
  const { authById, trainerNameById } = buildTrainerMaps(authUsers, trainerProfiles);

  return members.map((member) => {
    const activeAssignment = activeAssignmentsByMemberId.get(member.id);
    const activeTemplate = activeAssignment
      ? templateById.get(activeAssignment.routine_template_id)
      : null;
    const plan = currentPlansByMemberId.get(member.id);
    const linkedUser = member.supabase_user_id ? authById.get(member.supabase_user_id) : null;

    return {
      ...mapMemberSummary(member, plan, activeTemplate?.title ?? null),
      activeRoutineId: activeAssignment?.id ?? null,
      linkedUserEmail: linkedUser?.email ?? null,
      linkedUserId: member.supabase_user_id,
      phone: member.phone,
      trainerName: member.trainer_user_id ? trainerNameById.get(member.trainer_user_id) ?? null : null,
      trainerUserId: member.trainer_user_id,
      updatedAt: member.updated_at,
      // Legacy fields from Phase 1
      externalCode: member.external_code,
      birthDate: member.birth_date,
      gender: member.gender,
      address: member.address,
      districtOrUrbanization: member.district_or_urbanization,
      occupation: member.occupation,
      preferredSchedule: member.preferred_schedule,
      legacyNotes: member.legacy_notes,
      profileCompleted: member.profile_completed ?? false,
    } satisfies DashboardMemberListItem;
  });
}

export async function getDashboardMemberDetail(memberId: string): Promise<DashboardMemberDetail | null> {
  const client = createSupabaseAdminClient();
  const member = await getMemberProfileById(client, memberId);

  if (!member) {
    return null;
  }

  const [
    authOptions,
    trainerOptions,
    currentPlans,
    assignments,
    templates,
    financials,
    measurements,
  ] = await Promise.all([
    listDashboardAuthLinkOptions(),
    listDashboardTrainerOptions(),
    listCurrentPlans(client, [member.id]),
    listAssignments(client, [member.id]),
    listTemplates(client),
    getMemberFinancials(member.id),
    getMemberMeasurements(member.id),
  ]);
  const blocks = await listBlocks(
    client,
    templates.map((template) => template.id),
  );
  const exercises = await listExercises(client, blocks.map((block) => block.id));
  const { blockCountByTemplate, exerciseCountByTemplate } = buildTemplateCounts(
    templates,
    blocks,
    exercises,
  );

  const templateById = new Map(templates.map((template) => [template.id, template]));
  const trainerNameById = new Map(trainerOptions.map((trainer) => [trainer.userId, trainer.displayName]));
  const currentPlan = currentPlans[0] ?? null;
  const activeAssignment = assignments.find((assignment) => assignment.status === "active") ?? null;
  const activeTemplate = activeAssignment
    ? templateById.get(activeAssignment.routine_template_id) ?? null
    : null;
  const activeFeedback = await getActiveRoutineFeedback(client, member.id);
  const memberSummary = mapMemberSummary(member, currentPlan, activeTemplate?.title ?? null);
  const assignmentHistory = assignments.map((assignment) =>
    mapRoutineAssignment(
      assignment,
      templateById.get(assignment.routine_template_id)?.title ?? "Rutina",
      assignment.trainer_user_id ? trainerNameById.get(assignment.trainer_user_id) ?? null : null,
    ),
  );

  return {
    assignmentHistory,
    availableTemplates: templates
      .filter((template) => template.is_active)
      .map((template) =>
        mapRoutineTemplateListItem(template, {
          blockCount: blockCountByTemplate.get(template.id) ?? 0,
          exerciseCount: exerciseCountByTemplate.get(template.id) ?? 0,
          trainerName: template.trainer_user_id
            ? trainerNameById.get(template.trainer_user_id) ?? null
            : null,
        }),
      ),
    linkedUser: authOptions.find((option) => option.id === member.supabase_user_id) ?? null,
    member: {
      ...memberSummary,
      activeRoutineId: activeAssignment?.id ?? null,
      linkedUserEmail:
        authOptions.find((option) => option.id === member.supabase_user_id)?.email ?? null,
      linkedUserId: member.supabase_user_id,
      phone: member.phone,
      trainerName: member.trainer_user_id ? trainerNameById.get(member.trainer_user_id) ?? null : null,
      trainerUserId: member.trainer_user_id,
      updatedAt: member.updated_at,
      // Legacy fields from Phase 1
      externalCode: member.external_code,
      birthDate: member.birth_date,
      gender: member.gender,
      address: member.address,
      districtOrUrbanization: member.district_or_urbanization,
      occupation: member.occupation,
      preferredSchedule: member.preferred_schedule,
      legacyNotes: member.legacy_notes,
      profileCompleted: member.profile_completed ?? false,
    },
    notes: member.notes,
    plan: mapPlanSnapshot(currentPlan),
    trainingFeedback: buildTrainingFeedback(activeFeedback, exercises),
    statusMeta: {
      helperText: getMemberStatusHelper(member.status as MemberSummaryDto["status"]),
      label: member.status.toUpperCase(),
    },
    financials,
    measurements,
  };
}

export async function createMemberProfile(values: MemberFormValues) {
  const client = createSupabaseAdminClient();
  const parsed = memberFormSchema.parse(values);

  if (parsed.linkedUserId) {
    await getAuthUserById(parsed.linkedUserId);
  }

  const memberNumber = generateMemberNumber();
  
  // Calculate profile completion based on presence of key legacy fields
  const profileCompleted = Boolean(
    parsed.address &&
    parsed.birthDate &&
    parsed.districtOrUrbanization &&
    parsed.gender &&
    parsed.occupation &&
    parsed.preferredSchedule
  );
  
  const memberInsert: Database["public"]["Tables"]["member_profiles"]["Insert"] = {
    address: parsed.address ?? null,
    birth_date: parsed.birthDate ?? null,
    branch_name: parsed.branchName ?? null,
    district_or_urbanization: parsed.districtOrUrbanization ?? null,
    email: parsed.email.trim().toLowerCase(),
    external_code: parsed.externalCode ?? memberNumber, // Default to member_number if not provided
    full_name: parsed.fullName.trim(),
    gender: parsed.gender ?? null,
    join_date: parsed.joinDate,
    legacy_notes: parsed.legacyNotes ?? null,
    member_number: memberNumber,
    notes: parsed.notes ?? null,
    occupation: parsed.occupation ?? null,
    phone: parsed.phone ?? null,
    preferred_schedule: parsed.preferredSchedule ?? null,
    profile_completed: profileCompleted,
    status: parsed.status,
    supabase_user_id: parsed.linkedUserId ?? null,
    trainer_user_id: parsed.trainerUserId ?? null,
  };

  const { data: member, error: memberError } = await client
    .from("member_profiles")
    .insert(memberInsert)
    .select("id")
    .single();

  if (memberError) {
    throw new Error(memberError.message);
  }

  const { error: planError } = await client.from("member_plan_snapshots").insert({
    ends_at: parsed.planEndsAt ?? null,
    is_current: true,
    label: parsed.planLabel.trim(),
    member_id: member.id,
    notes: parsed.planNotes ?? null,
    started_at: parsed.planStartedAt ?? null,
    status: parsed.planStatus,
  });

  if (planError) {
    throw new Error(planError.message);
  }

  return member.id;
}

export async function archiveMemberProfile(memberId: string) {
  const client = createSupabaseAdminClient();
  const { data: member, error: memberError } = await client
    .from("member_profiles")
    .select("id, supabase_user_id")
    .eq("id", memberId)
    .maybeSingle();

  if (memberError) {
    throw new Error(memberError.message);
  }

  if (!member) {
    throw new Error("Socio no encontrado.");
  }

  await deleteMemberAuthUserIfAllowed(client, member as MemberDeleteCandidate);

  // Archive: change status to former, unlink auth user, keep all history
  const { error: updateError } = await client
    .from("member_profiles")
    .update({
      status: "former",
      supabase_user_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function deleteMemberProfile(memberId: string) {
  const client = createSupabaseAdminClient();
  const { data: member, error: memberError } = await client
    .from("member_profiles")
    .select("id, supabase_user_id")
    .eq("id", memberId)
    .maybeSingle();

  if (memberError) {
    throw new Error(memberError.message);
  }

  if (member) {
    await deleteMemberAuthUserIfAllowed(client, member as MemberDeleteCandidate);

    // Limpieza de datos operativos de la ficha (Planes, rutinas, etc)
    await cleanupMemberOperationalData(client, member.id);
  }

  // Finalmente borramos la ficha principal
  const { error } = await client.from("member_profiles").delete().eq("id", memberId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateMemberProfile(memberId: string, values: MemberFormValues) {
  const client = createSupabaseAdminClient();
  const parsed = memberFormSchema.parse(values);

  // Calculate profile completion based on presence of key legacy fields
  const profileCompleted = Boolean(
    parsed.address &&
    parsed.birthDate &&
    parsed.districtOrUrbanization &&
    parsed.gender &&
    parsed.occupation &&
    parsed.preferredSchedule
  );

  const { error: memberError } = await client
    .from("member_profiles")
    .update({
      address: parsed.address ?? null,
      birth_date: parsed.birthDate ?? null,
      branch_name: parsed.branchName ?? null,
      district_or_urbanization: parsed.districtOrUrbanization ?? null,
      email: parsed.email.trim().toLowerCase(),
      external_code: parsed.externalCode ?? null,
      full_name: parsed.fullName.trim(),
      gender: parsed.gender ?? null,
      join_date: parsed.joinDate,
      legacy_notes: parsed.legacyNotes ?? null,
      notes: parsed.notes ?? null,
      occupation: parsed.occupation ?? null,
      phone: parsed.phone ?? null,
      preferred_schedule: parsed.preferredSchedule ?? null,
      profile_completed: profileCompleted,
      status: parsed.status,
      supabase_user_id: parsed.linkedUserId ?? null,
      trainer_user_id: parsed.trainerUserId ?? null,
    })
    .eq("id", memberId);

  if (memberError) {
    throw new Error(memberError.message);
  }

  const { data: currentPlan, error: currentPlanError } = await client
    .from("member_plan_snapshots")
    .select("id")
    .eq("member_id", memberId)
    .eq("is_current", true)
    .maybeSingle();

  if (currentPlanError) {
    throw new Error(currentPlanError.message);
  }

  if (currentPlan?.id) {
    const { error: planUpdateError } = await client
      .from("member_plan_snapshots")
      .update({
        ends_at: parsed.planEndsAt ?? null,
        label: parsed.planLabel.trim(),
        notes: parsed.planNotes ?? null,
        started_at: parsed.planStartedAt ?? null,
        status: parsed.planStatus,
      })
      .eq("id", currentPlan.id);

    if (planUpdateError) {
      throw new Error(planUpdateError.message);
    }
  } else {
    const { error: planInsertError } = await client.from("member_plan_snapshots").insert({
      ends_at: parsed.planEndsAt ?? null,
      is_current: true,
      label: parsed.planLabel.trim(),
      member_id: memberId,
      notes: parsed.planNotes ?? null,
      started_at: parsed.planStartedAt ?? null,
      status: parsed.planStatus,
    });

    if (planInsertError) {
      throw new Error(planInsertError.message);
    }
  }
}

export async function updateMemberProfileFromMobile(memberId: string, values: MemberMobilePatchValues) {
  const client = createSupabaseAdminClient();
  const parsed = memberMobilePatchSchema.parse(values);
  const payload: Database["public"]["Tables"]["member_profiles"]["Update"] = {};

  if (typeof parsed.status !== "undefined") {
    payload.status = parsed.status;
  }

  if (typeof parsed.branchName !== "undefined") {
    payload.branch_name = parsed.branchName ?? null;
  }

  if (typeof parsed.notes !== "undefined") {
    payload.notes = parsed.notes ?? null;
  }

  const { error } = await client.from("member_profiles").update(payload).eq("id", memberId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listDashboardRoutineTemplates(search?: string) {
  const client = createSupabaseAdminClient();
  const [templates, assignments, trainerOptions] = await Promise.all([
    listTemplates(client),
    client
      .from("routine_assignments")
      .select("id, routine_template_id")
      .then(({ data, error }) => {
        if (error) {
          throw new Error(error.message);
        }

        return data ?? [];
      }),
    listDashboardTrainerOptions(),
  ]);
  const blocks = await listBlocks(
    client,
    templates.map((template) => template.id),
  );

  const exercises = await listExercises(client, blocks.map((block) => block.id));
  const { blockCountByTemplate, exerciseCountByTemplate } = buildTemplateCounts(
    templates,
    blocks,
    exercises,
  );

  const trainerNameById = new Map(trainerOptions.map((trainer) => [trainer.userId, trainer.displayName]));
  const assignmentCountByTemplate = new Map<string, number>();

  for (const assignment of assignments) {
    assignmentCountByTemplate.set(
      assignment.routine_template_id,
      (assignmentCountByTemplate.get(assignment.routine_template_id) ?? 0) + 1,
    );
  }

  const normalizedSearch = search?.trim().toLowerCase();

  return templates
    .filter((template) => {
      if (!normalizedSearch) {
        return true;
      }

      return `${template.title} ${template.goal} ${template.summary}`
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .map((template) => ({
      ...mapRoutineTemplateListItem(template, {
        blockCount: blockCountByTemplate.get(template.id) ?? 0,
        exerciseCount: exerciseCountByTemplate.get(template.id) ?? 0,
        trainerName: template.trainer_user_id
          ? trainerNameById.get(template.trainer_user_id) ?? null
          : null,
      }),
      assignedMembers: assignmentCountByTemplate.get(template.id) ?? 0,
      isActive: template.is_active,
    } satisfies DashboardRoutineTemplateListItem));
}

export async function getDashboardRoutineTemplateDetail(
  templateId: string,
): Promise<DashboardRoutineTemplateDetail | null> {
  const client = createSupabaseAdminClient();
  const template = await getTemplateById(client, templateId);

  if (!template) {
    return null;
  }

  const [blocks, trainerOptions, assignments, memberProfiles, currentPlans] = await Promise.all([
    listBlocks(client, [template.id]),
    listDashboardTrainerOptions(),
    client
      .from("routine_assignments")
      .select(
        "id, member_id, routine_template_id, trainer_user_id, assigned_by_user_id, notes, starts_on, ends_on, assigned_at, status, recommended_schedule_label, created_at, updated_at",
      )
      .eq("routine_template_id", template.id)
      .order("assigned_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          throw new Error(error.message);
        }

        return (data ?? []) as DBRoutineAssignment[];
      }),
    client
      .from("member_profiles")
      .select(
        "id, supabase_user_id, trainer_user_id, member_number, full_name, email, phone, status, branch_name, notes, join_date, created_at, updated_at",
      )
      .then(({ data, error }) => {
        if (error) {
          throw new Error(error.message);
        }

        return (data ?? []) as DBMemberProfile[];
      }),
    client
      .from("member_plan_snapshots")
      .select("id, member_id, label, status, started_at, ends_at, notes, is_current, created_at, updated_at")
      .eq("is_current", true)
      .then(({ data, error }) => {
        if (error) {
          throw new Error(error.message);
        }

        return (data ?? []) as DBMemberPlanSnapshot[];
      }),
  ]);

  const exercises = await listExercises(client, blocks.map((block) => block.id));
  const trainerNameById = new Map(trainerOptions.map((trainer) => [trainer.userId, trainer.displayName]));
  const memberById = new Map(memberProfiles.map((member) => [member.id, member]));
  const currentPlanByMemberId = new Map(currentPlans.map((plan) => [plan.member_id, plan]));

  return {
    assignedMembers: assignments.map((assignment) => {
      const member = memberById.get(assignment.member_id);
      const plan = currentPlanByMemberId.get(assignment.member_id);

      return {
        assignedAt: assignment.assigned_at,
        assignmentId: assignment.id,
        memberId: assignment.member_id,
        memberName: member?.full_name ?? "Miembro",
        planLabel: plan?.label ?? "Sin plan",
        status: assignment.status,
      };
    }),
    isActive: template.is_active,
    template: mapRoutineTemplateDetail(
      template,
      template.trainer_user_id ? trainerNameById.get(template.trainer_user_id) ?? null : null,
      blocks,
      exercises,
    ),
    trainerUserId: template.trainer_user_id,
  };
}

export async function createRoutineTemplate(values: RoutineTemplateFormValues, actorUserId?: string | null) {
  const client = createSupabaseAdminClient();
  const parsed = routineTemplateFormSchema.parse(values);
  const { data: template, error: templateError } = await client
    .from("routine_templates")
    .insert({
      created_by: actorUserId ?? null,
      difficulty_label: parsed.difficultyLabel,
      duration_label: parsed.durationLabel,
      goal: parsed.goal,
      intensity_label: parsed.intensityLabel,
      is_active: parsed.isActive,
      notes: parsed.notes ?? null,
      slug: resolveRoutineTemplateSlug(parsed.title),
      status_label: parsed.statusLabel,
      summary: parsed.summary,
      title: parsed.title,
      trainer_user_id: parsed.trainerUserId ?? null,
    })
    .select("id")
    .single();

  if (templateError) {
    throw new Error(templateError.message);
  }

  for (const [blockIndex, block] of parsed.blocks.entries()) {
    const { data: insertedBlock, error: blockError } = await client
      .from("routine_template_blocks")
      .insert({
        description: block.description ?? null,
        routine_template_id: template.id,
        sort_order: blockIndex,
        title: block.title,
      })
      .select("id")
      .single();

    if (blockError) {
      throw new Error(blockError.message);
    }

    const exercisesToInsert = block.exercises.map((exercise, exerciseIndex) => ({
      name: exercise.name,
      notes: exercise.notes ?? null,
      reps_label: exercise.reps,
      rest_seconds: exercise.restSeconds,
      routine_block_id: insertedBlock.id,
      sets_label: exercise.sets,
      sort_order: exerciseIndex,
    }));

    const { error: exerciseError } = await client
      .from("routine_template_exercises")
      .insert(exercisesToInsert);

    if (exerciseError) {
      throw new Error(exerciseError.message);
    }
  }

  return template.id;
}

export async function updateRoutineTemplate(
  templateId: string,
  values: RoutineTemplateFormValues,
) {
  const client = createSupabaseAdminClient();
  const parsed = routineTemplateFormSchema.parse(values);
  const existingTemplate = await getTemplateById(client, templateId);

  if (!existingTemplate) {
    throw new Error("No encontramos la plantilla de rutina.");
  }

  const { error: templateError } = await client
    .from("routine_templates")
    .update({
      difficulty_label: parsed.difficultyLabel,
      duration_label: parsed.durationLabel,
      goal: parsed.goal,
      intensity_label: parsed.intensityLabel,
      is_active: parsed.isActive,
      notes: parsed.notes ?? null,
      slug: resolveRoutineTemplateSlug(parsed.title, existingTemplate.slug),
      status_label: parsed.statusLabel,
      summary: parsed.summary,
      title: parsed.title,
      trainer_user_id: parsed.trainerUserId ?? null,
    })
    .eq("id", templateId);

  if (templateError) {
    throw new Error(templateError.message);
  }

  const existingBlocks = await listBlocks(client, [templateId]);

  if (existingBlocks.length > 0) {
    const { error: deleteBlocksError } = await client
      .from("routine_template_blocks")
      .delete()
      .eq("routine_template_id", templateId);

    if (deleteBlocksError) {
      throw new Error(deleteBlocksError.message);
    }
  }

  for (const [blockIndex, block] of parsed.blocks.entries()) {
    const { data: insertedBlock, error: blockError } = await client
      .from("routine_template_blocks")
      .insert({
        description: block.description ?? null,
        routine_template_id: templateId,
        sort_order: blockIndex,
        title: block.title,
      })
      .select("id")
      .single();

    if (blockError) {
      throw new Error(blockError.message);
    }

    const exercisesToInsert = block.exercises.map((exercise, exerciseIndex) => ({
      name: exercise.name,
      notes: exercise.notes ?? null,
      reps_label: exercise.reps,
      rest_seconds: exercise.restSeconds,
      routine_block_id: insertedBlock.id,
      sets_label: exercise.sets,
      sort_order: exerciseIndex,
    }));

    const { error: exerciseError } = await client
      .from("routine_template_exercises")
      .insert(exercisesToInsert);

    if (exerciseError) {
      throw new Error(exerciseError.message);
    }
  }
}

export async function assignRoutineToMember(values: AssignRoutineInput, actorUserId?: string | null) {
  const client = createSupabaseAdminClient();
  const parsed = assignRoutineFormSchema.parse(values);
  const member = await getMemberProfileById(client, parsed.memberId);

  if (!member) {
    throw new Error("No encontramos la ficha del miembro.");
  }

  const { error: archiveError } = await client
    .from("routine_assignments")
    .update({
      ends_on: parsed.startsOn ?? new Date().toISOString().slice(0, 10),
      status: "archived",
    })
    .eq("member_id", parsed.memberId)
    .eq("status", "active");

  if (archiveError) {
    throw new Error(archiveError.message);
  }

  const { data: insertedAssignment, error: assignmentError } = await client
    .from("routine_assignments")
    .insert({
      assigned_by_user_id: actorUserId ?? null,
      ends_on: parsed.endsOn ?? null,
      member_id: parsed.memberId,
      notes: trimToNull(parsed.notes),
      recommended_schedule_label: trimToNull(parsed.recommendedScheduleLabel),
      routine_template_id: parsed.templateId,
      starts_on: parsed.startsOn ?? null,
      status: "active",
      trainer_user_id: member.trainer_user_id ?? actorUserId ?? null,
    })
    .select("id")
    .single();

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  return {
    assignmentId: insertedAssignment.id,
    memberId: parsed.memberId,
    message: `Rutina activa para ${member.full_name}.`,
    status: "active",
    templateId: parsed.templateId,
  } satisfies AssignRoutineResponse;
}

export async function promoteUserToTrainer(
  userId: string,
  assignedBy: string | null,
  note = "Promocion irreversible a trainer desde dashboard mobile.",
) {
  const client = createSupabaseAdminClient();
  const user = await getAuthUserById(userId);

  if (!user.email) {
    throw new Error("El usuario no tiene email valido para asignar trainer.");
  }

  const displayName = getUserDisplayName(user);

  const { error: roleError } = await client.from("user_roles").upsert(
    {
      assigned_by: assignedBy,
      is_irreversible: true,
      note,
      role: TRAINER_ROLE,
      user_id: userId,
    },
    {
      onConflict: "user_id,role",
    },
  );

  if (roleError) {
    throw new Error(roleError.message);
  }

  const { error: trainerProfileError } = await client.from("trainer_profiles").upsert(
    {
      display_name: displayName,
      is_active: true,
      user_id: userId,
    },
    {
      onConflict: "user_id",
    },
  );

  if (trainerProfileError) {
    throw new Error(trainerProfileError.message);
  }
}

export async function demoteTrainerFromUser(userId: string) {
  const client = createSupabaseAdminClient();

  const { error: roleError } = await client
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", TRAINER_ROLE);

  if (roleError) {
    throw new Error(roleError.message);
  }

  const { error: profileError } = await client
    .from("trainer_profiles")
    .update({ is_active: false })
    .eq("user_id", userId);

  if (profileError) {
    throw new Error(profileError.message);
  }
}

export async function linkAuthUserToMemberProfile(userId: string, memberId: string | null) {
  const client = createSupabaseAdminClient();

  // Si memberId es null, desvinculamos
  if (!memberId) {
    const { error } = await client
      .from("member_profiles")
      .update({ supabase_user_id: null })
      .eq("supabase_user_id", userId);

    if (error) throw new Error(error.message);
    return;
  }

  // Verificamos que el miembro no tenga ya un usuario vinculado
  const { data: existing } = await client
    .from("member_profiles")
    .select("id")
    .eq("supabase_user_id", userId)
    .maybeSingle();

  if (existing && existing.id !== memberId) {
    // Desvinculamos el anterior primero
    await client.from("member_profiles").update({ supabase_user_id: null }).eq("id", existing.id);
  }

  const { error } = await client
    .from("member_profiles")
    .update({ supabase_user_id: userId })
    .eq("id", memberId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function toggleAppAccess(userId: string, shouldHaveAccess: boolean) {
  const client = createSupabaseAdminClient();
  const { APP_BLOCKED_ROLE } = await import("@/lib/user-roles");

  if (shouldHaveAccess) {
    const { error } = await client
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", APP_BLOCKED_ROLE);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await client.from("user_roles").upsert(
      {
        user_id: userId,
        role: APP_BLOCKED_ROLE,
        note: "Acceso bloqueado manualmente desde dashboard.",
      },
      { onConflict: "user_id,role" }
    );

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function createLiveMobileSession(
  user: User,
  role: MobileRole,
  staffAccessLevel: MobileStaffAccessLevel | null = null,
): Promise<MobileSession> {
  const client = createSupabaseAdminClient();
  const member =
    role === "member"
      ? await ensureMemberProfileForUser(user)
      : await getMemberProfileBySupabaseUserId(client, user.id);

  if (!member) {
    return {
      displayName: getUserDisplayName(user),
      email: user.email ?? "sin-email@invalid.local",
      hasActiveRoutine: false,
      member: null,
      role,
      staffAccessLevel,
      userId: user.id,
    };
  }

  const [plans, assignments, templates] = await Promise.all([
    listCurrentPlans(client, [member.id]),
    listAssignments(client, [member.id]),
    listTemplates(client),
  ]);
  const activeAssignment = assignments.find((assignment) => assignment.status === "active") ?? null;
  const templateById = new Map(templates.map((template) => [template.id, template]));
  const activeTemplate = activeAssignment
    ? templateById.get(activeAssignment.routine_template_id) ?? null
    : null;
  const memberSummary = mapMemberSummary(member, plans[0] ?? null, activeTemplate?.title ?? null);

  return {
    displayName: getUserDisplayName(user),
    email: user.email ?? member.email,
    hasActiveRoutine: Boolean(activeAssignment),
    member: memberSummary,
    role,
    staffAccessLevel,
    userId: user.id,
  };
}

export const getLiveMobileSession = createLiveMobileSession;

export async function getLiveRoutineForSession(session: MobileSession): Promise<RoutineDetailDto | null> {
  if (!session.member) {
    return null;
  }

  const client = createSupabaseAdminClient();
  const activeAssignment = await getActiveAssignmentForMember(client, session.member.id);

  if (!activeAssignment) {
    return null;
  }

  const template = await getTemplateById(client, activeAssignment.routine_template_id);

  if (!template) {
    return null;
  }

  const blocks = await listBlocks(client, [template.id]);
  const exercises = await listExercises(client, blocks.map((block) => block.id));
  const trainerOptions = await listDashboardTrainerOptions();
  const trainerNameById = new Map(trainerOptions.map((trainer) => [trainer.userId, trainer.displayName]));
  const trainerName =
    (activeAssignment.trainer_user_id
      ? trainerNameById.get(activeAssignment.trainer_user_id) ?? null
      : null) ??
    (template.trainer_user_id ? trainerNameById.get(template.trainer_user_id) ?? null : null);
  const [routineFeedbackRows, exerciseFeedbackRows] = await Promise.all([
    listRoutineFeedbackByAssignments(client, [activeAssignment.id]),
    listExerciseFeedbackByAssignments(client, [activeAssignment.id]),
  ]);

  return mapRoutineDetail(
    template,
    activeAssignment,
    trainerName,
    blocks,
    exercises,
    routineFeedbackRows.find((feedback) => feedback.member_id === session.member!.id) ?? null,
    exerciseFeedbackRows.filter((feedback) => feedback.member_id === session.member!.id),
  );
}

export async function getLiveHistoryForSession(session: MobileSession): Promise<MemberHistoryResponse> {
  if (!session.member) {
    return { items: [] };
  }

  const client = createSupabaseAdminClient();
  const [assignments, templates] = await Promise.all([
    listAssignments(client, [session.member.id]),
    listTemplates(client),
  ]);
  const templateById = new Map(templates.map((template) => [template.id, template]));

  return {
    items: assignments
      .filter((assignment) => assignment.status !== "active")
      .map((assignment) => ({
        completedAt: assignment.assigned_at,
        id: assignment.id,
        metricLabel: "ESTADO",
        metricValue: getAssignmentStatusLabel(assignment.status).toUpperCase(),
        title: templateById.get(assignment.routine_template_id)?.title ?? "Rutina",
      })),
  };
}

export async function getLiveStaffDashboard(): Promise<StaffDashboardDto> {
  const members = await listDashboardMembers();

  return {
    activeMembers: members.filter((member) => member.status === "active").length,
    pendingAssignments: members.filter((member) => !member.currentRoutineTitle).length,
    quickActions: [
      { id: "search-member", label: "Buscar miembro", href: "/members" },
      { id: "review-templates", label: "Revisar plantillas", href: "/templates" },
    ],
    recentActivity: members.slice(0, 3).map((member) => ({
      accentLabel: member.currentRoutineTitle ? "Rutina" : "Pendiente",
      description: member.currentRoutineTitle
        ? `${member.currentRoutineTitle} lista para seguimiento mobile.`
        : "Necesita una asignacion de rutina.",
      id: member.id,
      memberName: member.fullName,
    })),
    systemStatus:
      members.length === 0
        ? "Todavia no hay miembros operativos cargados en Supabase."
        : "Miembros, planes y rutinas sincronizados desde el backend del gimnasio.",
  };
}

export async function listLiveStaffMembers(search: string | null): Promise<StaffMemberListItemDto[]> {
  const members = await listDashboardMembers({ search: search ?? undefined });

  return members.map((member) => ({
    fullName: member.fullName,
    id: member.id,
    planLabel: member.planLabel,
    priorityLabel: member.currentRoutineTitle ? null : "Asignar rutina",
    routineTitle: member.currentRoutineTitle,
    status: member.status,
  }));
}

export async function getLiveStaffMemberDetail(memberId: string): Promise<StaffMemberDetailDto | null> {
  const detail = await getDashboardMemberDetail(memberId);

  if (!detail) {
    return null;
  }

  const activeRoutineSummary =
    detail.member.currentRoutineTitle && detail.assignmentHistory.length
      ? {
          durationLabel: detail.plan?.status ?? "Activa",
          goal: detail.plan?.label ?? "Rutina activa",
          heroImageUrl: null,
          id: detail.assignmentHistory[0]?.id ?? detail.member.id,
          intensityLabel: detail.plan?.label ?? "Operativa",
          statusLabel: detail.assignmentHistory[0]
            ? getAssignmentStatusLabel(detail.assignmentHistory[0].status)
            : "Activa",
          summary: detail.member.currentRoutineTitle,
          title: detail.member.currentRoutineTitle,
        }
      : null;

  return {
    accountTypeLabel: detail.plan?.label ?? "Sin plan",
    activeRoutine: activeRoutineSummary,
    assignmentHistory: detail.assignmentHistory,
    branchLabel: detail.member.branchName ?? "Sin sede",
    lastAttendanceLabel: detail.member.updatedAt,
    member: detail.member,
    plan: detail.plan,
    quickStats: [
      { id: "member-number", label: "Member", value: detail.member.memberNumber },
      { id: "branch", label: "Sede", value: detail.member.branchName ?? "Sin sede" },
      { id: "plan", label: "Plan", value: detail.plan?.label ?? "Sin plan" },
    ],
    recommendedAction: {
      helperText: detail.member.currentRoutineTitle
        ? "Puedes ajustar el estado del socio o reasignar una plantilla."
        : "Esta ficha todavia necesita una rutina activa.",
      title: detail.member.currentRoutineTitle ? "REVISAR FICHA" : "ASIGNAR RUTINA",
    },
    status: MemberStatusDtoSchema.parse({
      helperText: detail.statusMeta.helperText,
      label: detail.statusMeta.label,
      status: detail.member.status,
    }),
    trainingFeedback: detail.trainingFeedback,
  };
}

export async function listLiveRoutineTemplates(): Promise<RoutineTemplateListItemDto[]> {
  const templates = await listDashboardRoutineTemplates();
  return templates.filter((template) => template.isActive).map((template) =>
    RoutineTemplateListItemDtoSchema.parse({
      blockCount: template.blockCount,
      difficultyLabel: template.difficultyLabel,
      durationLabel: template.durationLabel,
      exerciseCount: template.exerciseCount,
      goal: template.goal,
      id: template.id,
      intensityLabel: template.intensityLabel,
      statusLabel: template.statusLabel,
      summary: template.summary,
      title: template.title,
      trainerName: template.trainerName,
      updatedAt: template.updatedAt,
    }),
  );
}

export async function assignRoutineToMemberForMobile(
  input: unknown,
  actorUserId: string | null,
): Promise<AssignRoutineResponse> {
  const parsed = AssignRoutineInputSchema.parse(input);
  return assignRoutineToMember(parsed, actorUserId);
}

async function upsertRoutineFeedback(
  client: GymAdminClient,
  memberId: string,
  assignmentId: string,
  input: UpdateRoutineFeedbackInput,
) {
  const parsed = UpdateRoutineFeedbackInputSchema.parse(input);
  const note = trimToNull(parsed.note);
  const { data: existing, error: existingError } = await client
    .from("member_routine_feedback")
    .select("id")
    .eq("member_id", memberId)
    .eq("routine_assignment_id", assignmentId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    const { error } = await client
      .from("member_routine_feedback")
      .update({
        liked: parsed.liked,
        note,
      })
      .eq("id", existing.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await client.from("member_routine_feedback").insert({
    liked: parsed.liked,
    member_id: memberId,
    note,
    routine_assignment_id: assignmentId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function upsertExerciseFeedback(
  client: GymAdminClient,
  memberId: string,
  assignmentId: string,
  exerciseId: string,
  input: UpdateExerciseFeedbackInput,
) {
  const parsed = UpdateExerciseFeedbackInputSchema.parse(input);
  const note = trimToNull(parsed.note);
  const { data: existing, error: existingError } = await client
    .from("member_routine_exercise_feedback")
    .select("id")
    .eq("member_id", memberId)
    .eq("routine_assignment_id", assignmentId)
    .eq("routine_template_exercise_id", exerciseId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    const { error } = await client
      .from("member_routine_exercise_feedback")
      .update({
        liked: parsed.liked,
        note,
      })
      .eq("id", existing.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await client.from("member_routine_exercise_feedback").insert({
    liked: parsed.liked,
    member_id: memberId,
    note,
    routine_assignment_id: assignmentId,
    routine_template_exercise_id: exerciseId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateLiveRoutineFeedbackForSession(
  session: MobileSession,
  input: unknown,
): Promise<RoutineDetailDto | null> {
  if (!session.member) {
    throw new Error("No encontramos una ficha operativa para esta cuenta.");
  }

  const client = createSupabaseAdminClient();
  const activeAssignment = await getActiveAssignmentForMember(client, session.member.id);

  if (!activeAssignment) {
    throw new Error("No hay rutina activa para registrar feedback.");
  }

  await upsertRoutineFeedback(client, session.member.id, activeAssignment.id, input as UpdateRoutineFeedbackInput);
  return getLiveRoutineForSession(session);
}

export async function updateLiveExerciseFeedbackForSession(
  session: MobileSession,
  exerciseId: string,
  input: unknown,
): Promise<RoutineDetailDto | null> {
  if (!session.member) {
    throw new Error("No encontramos una ficha operativa para esta cuenta.");
  }

  const client = createSupabaseAdminClient();
  const activeAssignment = await getActiveAssignmentForMember(client, session.member.id);

  if (!activeAssignment) {
    throw new Error("No hay rutina activa para registrar feedback.");
  }

  const blocks = await listBlocks(client, [activeAssignment.routine_template_id]);
  const exercises = await listExercises(client, blocks.map((block) => block.id));

  if (!exercises.some((exercise) => exercise.id === exerciseId)) {
    throw new Error("El ejercicio no pertenece a la rutina activa.");
  }

  await upsertExerciseFeedback(
    client,
    session.member.id,
    activeAssignment.id,
    exerciseId,
    input as UpdateExerciseFeedbackInput,
  );
  return getLiveRoutineForSession(session);
}

export async function updateLiveMemberFromMobile(memberId: string, input: unknown) {
  const parsed = memberMobilePatchSchema.parse(input);
  await updateMemberProfileFromMobile(memberId, parsed);
}
