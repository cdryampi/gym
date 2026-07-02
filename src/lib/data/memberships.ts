import { cache } from "react";
import type { AuthUser as User } from "@/lib/auth-user";

import {
  PUBLIC_CACHE_REVALIDATE_SECONDS,
  PUBLIC_CACHE_TAGS,
  publicDataCache,
} from "@/lib/cache/public-cache";
import {
  ensureMemberProfileForUser,
  getMemberProfileById,
  ensureMemberProfileQrToken,
} from "@/lib/data/gym-management";
import { syncMembershipRequestToMedusa } from "@/lib/data/membership-commerce";
import { defaultSiteSettings } from "@/lib/data/default-content";
import { getMarketingData } from "@/lib/data/site";
import { getSmtpEnv, hasSmtpEnv } from "@/lib/env";
import { sendMembershipRequestEmail } from "@/lib/email/membership-request";
import { resolveTransactionalSender } from "@/lib/email/policy";
import {
  deriveMembershipValidation,
  mapMembershipManualPaymentSummary,
  type MembershipCommerceSyncStatus,
  type MembershipMemberSummary,
  type MembershipPaymentEntry,
  type MembershipPlan,
  type MembershipPublicStatus,
  type MembershipReceptionScanResult,
  type MembershipRequestAnnotation,
  type MembershipRequestDetail,
  type MembershipRequestStatus,
} from "@/lib/memberships";
import {
  buildMembershipQrPublicValidationUrl,
  parseMembershipQrScannedValue,
} from "@/lib/membership-qr";
import { SITE_URL } from "@/lib/seo";
import {
  type DBMembershipPaymentEntry,
  type DBMembershipPlan,
  type DBMembershipRequest,
  type DBMembershipRequestAnnotation,
  type DBMemberProfile,
  type DBTrainerProfile,
} from "@/lib/supabase/database.types";
import {
  createSupabaseAdminClient,
  createSupabasePublicClient,
} from "@/lib/supabase/server";
import {
  membershipAdminCreateRequestSchema,
  membershipPaymentEntrySchema,
  membershipPlanReserveSchema,
  membershipRequestAnnotationSchema,
  membershipRequestDatesSchema,
  membershipRequestStatusSchema,
  type MembershipAdminCreateRequestInput,
  type MembershipPaymentEntryInput,
  type MembershipPlanReserveInput,
  type MembershipRequestAnnotationInput,
  type MembershipRequestDatesInput,
} from "@/lib/validators/memberships";
import { trimToNull } from "@/lib/utils";

type MembershipClient = ReturnType<typeof createSupabaseAdminClient>;

type MembershipRequestRow = DBMembershipRequest;
type MembershipAnnotationRow = DBMembershipRequestAnnotation;
type MembershipPaymentEntryRow = DBMembershipPaymentEntry;

interface MembershipRequestListFilters {
  dateFrom?: string | null;
  dateTo?: string | null;
  memberId?: string | null;
  q?: string | null;
  status?: MembershipRequestStatus | null;
  supabaseUserId?: string | null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateMembershipRequestNumber() {
  const date = new Date();
  const stamp = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();

  return `MEM-${stamp}-${suffix}`;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function resolveCycleWindow(input: {
  durationDays: number;
  cycleEndsOn?: string | null;
  cycleStartsOn?: string | null;
  bonusDays?: number;
}) {
  const cycleStartsOn = trimToNull(input.cycleStartsOn) ?? toIsoDate(new Date());
  const startDate = new Date(`${cycleStartsOn}T00:00:00.000Z`);
  const cycleEndsOn =
    trimToNull(input.cycleEndsOn) ??
    toIsoDate(addDays(startDate, input.durationDays + (input.bonusDays ?? 0) - 1));

  return {
    cycleStartsOn,
    cycleEndsOn,
  };
}

function mapMembershipPlan(row: DBMembershipPlan): MembershipPlan {
  return row as MembershipPlan;
}

function mapMembershipAnnotation(row: MembershipAnnotationRow): MembershipRequestAnnotation {
  return row;
}

function mapMembershipPaymentEntry(row: MembershipPaymentEntryRow): MembershipPaymentEntry {
  return row;
}

function mapMembershipMemberSummary(input: {
  member: DBMemberProfile;
  trainerName: string | null;
}): MembershipMemberSummary {
  return {
    id: input.member.id,
    memberNumber: input.member.member_number,
    fullName: input.member.full_name,
    email: input.member.email,
    phone: input.member.phone,
    status: input.member.status,
    branchName: input.member.branch_name,
    supabaseUserId: input.member.supabase_user_id,
    trainerUserId: input.member.trainer_user_id,
    trainerName: input.trainerName,
    trainingPlanLabel: input.member.training_plan_label,
    membershipQrToken: input.member.membership_qr_token,
  };
}

function mapMembershipRequestDetail(input: {
  plan: DBMembershipPlan;
  request: MembershipRequestRow;
  member: DBMemberProfile;
  trainerName: string | null;
}): MembershipRequestDetail {
  const manualPaymentSummary = mapMembershipManualPaymentSummary(input.request);
  const commerceSyncStatus: MembershipCommerceSyncStatus =
    input.request.medusa_sync_status === "ok" || input.request.medusa_sync_status === "error"
      ? input.request.medusa_sync_status
      : "pending";

  return {
    id: input.request.id,
    requestNumber: input.request.request_number,
    email: input.request.email,
    supabaseUserId: input.request.supabase_user_id,
    status: membershipRequestStatusSchema.parse(input.request.status),
    source: input.request.source,
    notes: input.request.notes,
    createdAt: input.request.created_at,
    updatedAt: input.request.updated_at,
    activatedAt: input.request.activated_at,
    emailStatus:
      input.request.email_status === "sent" || input.request.email_status === "failed"
        ? input.request.email_status
        : "pending",
    emailSentAt: input.request.email_sent_at,
    emailError: input.request.email_error,
    cycleStartsOn: input.request.cycle_starts_on,
    cycleEndsOn: input.request.cycle_ends_on,
    billingLabel: input.request.billing_label,
    currencyCode: input.request.currency_code,
    durationDays: input.request.duration_days,
    priceAmount: input.request.price_amount,
    planTitleSnapshot: input.request.plan_title_snapshot,
    renewsFromRequestId: input.request.renews_from_request_id,
    commerce: {
      cartId: input.request.medusa_cart_id,
      orderId: input.request.medusa_order_id,
      productId: input.request.medusa_product_id,
      syncError: input.request.medusa_sync_error,
      syncStatus: commerceSyncStatus,
      syncedAt: input.request.medusa_synced_at,
      variantId: input.request.medusa_variant_id,
    },
    member: mapMembershipMemberSummary({
      member: input.member,
      trainerName: input.trainerName,
    }),
    plan: mapMembershipPlan(input.plan),
    manualPaymentSummary,
    validation: deriveMembershipValidation({
      cycleEndsOn: input.request.cycle_ends_on,
      cycleStartsOn: input.request.cycle_starts_on,
      manualPaymentStatus: manualPaymentSummary.status,
      requestStatus: membershipRequestStatusSchema.parse(input.request.status),
    }),
  };
}

async function listMembershipPlansByIds(client: MembershipClient, ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, DBMembershipPlan>();
  }

  const { data, error } = await client
    .from("membership_plans")
    .select("*")
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((plan) => [plan.id, plan as DBMembershipPlan]));
}

async function listMemberProfilesByIds(client: MembershipClient, ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, DBMemberProfile>();
  }

  const { data, error } = await client
    .from("member_profiles")
    .select("*")
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((member) => [member.id, member as DBMemberProfile]));
}

async function listTrainerNamesByIds(client: MembershipClient, ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await client
    .from("trainer_profiles")
    .select("user_id, display_name")
    .in("user_id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    (data ?? []).map((trainer) => [
      trainer.user_id,
      (trainer as Pick<DBTrainerProfile, "display_name" | "user_id">).display_name ??
        "Coach asignado",
    ]),
  );
}

async function getMembershipRequestRowById(client: MembershipClient, id: string) {
  const { data, error } = await client
    .from("membership_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as MembershipRequestRow | null;
}

async function getLatestMembershipRequestRowForMember(
  client: MembershipClient,
  memberId: string,
) {
  const { data, error } = await client
    .from("membership_requests")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as MembershipRequestRow | null;
}

async function markMembershipRequestEmailResult(
  client: MembershipClient,
  membershipRequestId: string,
  input: {
    emailError?: string | null;
    emailSentAt?: string | null;
    emailStatus: "pending" | "sent" | "failed";
  },
) {
  const { error } = await client
    .from("membership_requests")
    .update({
      email_error: input.emailError ?? null,
      email_sent_at: input.emailSentAt ?? null,
      email_status: input.emailStatus,
    })
    .eq("id", membershipRequestId);

  if (error) {
    throw new Error(error.message);
  }
}

async function buildMembershipRequestDetail(
  client: MembershipClient,
  request: MembershipRequestRow,
): Promise<MembershipRequestDetail> {
  const [planMap, memberMap] = await Promise.all([
    listMembershipPlansByIds(client, [request.membership_plan_id]),
    listMemberProfilesByIds(client, [request.member_id]),
  ]);

  const member = memberMap.get(request.member_id);
  const plan = planMap.get(request.membership_plan_id);

  if (!member || !plan) {
    throw new Error("La solicitud de membresia quedo huerfana de socio o plan.");
  }

  const trainerNameMap = await listTrainerNamesByIds(
    client,
    member.trainer_user_id ? [member.trainer_user_id] : [],
  );

  return mapMembershipRequestDetail({
    request,
    member,
    plan,
    trainerName: member.trainer_user_id
      ? trainerNameMap.get(member.trainer_user_id) ?? null
      : null,
  });
}

async function sendMembershipRequestEmailIfPossible(
  client: MembershipClient,
  request: MembershipRequestDetail,
) {
  const attemptedAt = new Date().toISOString();

  if (!hasSmtpEnv()) {
    await markMembershipRequestEmailResult(client, request.id, {
      emailError:
        "Configura SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASSWORD para enviar el QR de membresias.",
      emailSentAt: attemptedAt,
      emailStatus: "failed",
    });
    return;
  }

  const { settings } = await getMarketingData();
  const siteName = settings.site_name ?? defaultSiteSettings.site_name;
  const smtp = getSmtpEnv();
  const sender = resolveTransactionalSender(
    siteName,
    settings.transactional_from_email ?? defaultSiteSettings.transactional_from_email,
    smtp.fromEmail,
    [smtp.user],
  );

  try {
    await sendMembershipRequestEmail({
      fromEmail: sender.fromEmail,
      internalRecipient: settings.notification_email ?? defaultSiteSettings.notification_email,
      replyTo: sender.replyTo ?? settings.contact_email ?? defaultSiteSettings.contact_email,
      request,
      siteName,
    });

    await markMembershipRequestEmailResult(client, request.id, {
      emailError: null,
      emailSentAt: attemptedAt,
      emailStatus: "sent",
    });
  } catch (error) {
    await markMembershipRequestEmailResult(client, request.id, {
      emailError:
        error instanceof Error
          ? error.message
          : "No se pudo enviar el email del QR de la membresia.",
      emailSentAt: attemptedAt,
      emailStatus: "failed",
    });
  }
}

export async function resendMembershipRequestEmail(membershipRequestId: string) {
  const client = createSupabaseAdminClient();
  const request = await getMembershipRequestRowById(client, membershipRequestId);

  if (!request) {
    throw new Error("La solicitud de membresia ya no existe.");
  }

  const detailBeforeEmail = await buildMembershipRequestDetail(client, request);
  await sendMembershipRequestEmailIfPossible(client, detailBeforeEmail);

  const refreshedRequest = await getMembershipRequestRowById(client, membershipRequestId);

  if (!refreshedRequest) {
    throw new Error("La solicitud de membresia ya no se pudo recargar tras el intento de email.");
  }

  return buildMembershipRequestDetail(client, refreshedRequest);
}

async function syncMemberProfileMembership(client: MembershipClient, input: {
  memberId: string;
  membershipPlanId: string | null;
  status: DBMemberProfile["status"];
}) {
  const payload: Pick<
    DBMemberProfile,
    "membership_plan_id" | "status"
  > = {
    membership_plan_id: input.membershipPlanId,
    status: input.status,
  };

  const { error } = await client
    .from("member_profiles")
    .update(payload)
    .eq("id", input.memberId);

  if (error) {
    throw new Error(error.message);
  }
}

function mapMembershipRequestStatusToMemberStatus(
  status: MembershipRequestStatus,
): DBMemberProfile["status"] {
  switch (status) {
    case "active":
      return "active";
    case "paused":
      return "paused";
    case "cancelled":
    case "expired":
      return "former";
    case "requested":
    case "confirmed":
    default:
      return "prospect";
  }
}

function getFallbackMemberStatusAfterMembershipDeletion(
  status: MembershipRequestStatus,
): DBMemberProfile["status"] {
  switch (status) {
    case "requested":
    case "confirmed":
      return "prospect";
    case "active":
    case "paused":
    case "expired":
    case "cancelled":
    default:
      return "former";
  }
}

async function maybePromoteMembershipRequestToActive(
  client: MembershipClient,
  requestId: string,
) {
  const request = await getMembershipRequestRowById(client, requestId);

  if (!request) {
    throw new Error("La solicitud de membresia ya no existe.");
  }

  if (
    (request.manual_payment_status === "paid" || request.manual_payment_status === "overpaid") &&
    request.status !== "active"
  ) {
    const { error } = await client
      .from("membership_requests")
      .update({
        status: "active",
        activated_at: request.activated_at ?? new Date().toISOString(),
      })
      .eq("id", request.id);

    if (error) {
      throw new Error(error.message);
    }

    await syncMemberProfileMembership(client, {
      memberId: request.member_id,
      membershipPlanId: request.membership_plan_id,
      status: "active",
    });
  }
}

const listPublicMembershipPlansCached = publicDataCache(
  async () => {
    const client = createSupabasePublicClient();
    const { data, error } = await client
      .from("membership_plans")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .eq("is_active", true)
      .eq("is_featured", true);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapMembershipPlan(row as DBMembershipPlan));
  },
  ["public-membership-plans"],
  {
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS.membershipPlans,
    tags: [PUBLIC_CACHE_TAGS.membershipPlans],
  },
);

export const listMembershipPlans = cache(async function listMembershipPlans(options?: {
  activeOnly?: boolean;
}) {
  const activeOnly = options?.activeOnly ?? true;

  if (activeOnly) {
    return listPublicMembershipPlansCached();
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("membership_plans")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapMembershipPlan(row as DBMembershipPlan));
});

export async function getMembershipPlanById(id: string) {
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("membership_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapMembershipPlan(data as DBMembershipPlan) : null;
}

export async function createMembershipRequestForUser(
  user: User,
  values: MembershipPlanReserveInput,
) {
  const parsed = membershipPlanReserveSchema.parse(values);
  const memberProfile = await ensureMemberProfileForUser(user);

  return createMembershipRequest({
    memberId: memberProfile.id,
    membershipPlanId: parsed.membershipPlanId,
    notes: parsed.notes,
    source: "member-portal",
    supabaseUserId: user.id,
  });
}

export async function createMembershipRequest(values: MembershipAdminCreateRequestInput & {
  supabaseUserId?: string | null;
}) {
  const parsed = membershipAdminCreateRequestSchema.parse(values);
  const client = createSupabaseAdminClient();

  const [member, plan, latestRequest, activeRequest] = await Promise.all([
    client
      .from("member_profiles")
      .select("*")
      .eq("id", parsed.memberId)
      .maybeSingle(),
    client
      .from("membership_plans")
      .select("*")
      .eq("id", parsed.membershipPlanId)
      .maybeSingle(),
    client
      .from("membership_requests")
      .select("id")
      .eq("member_id", parsed.memberId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("membership_requests")
      .select("id")
      .eq("member_id", parsed.memberId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
  ]);

  if (member.error) {
    throw new Error(member.error.message);
  }

  if (plan.error) {
    throw new Error(plan.error.message);
  }

  if (!member.data) {
    throw new Error("No se encontro la ficha del socio para crear la membresia.");
  }

  if (!plan.data) {
    throw new Error("El plan de membresia seleccionado ya no existe.");
  }

  if (activeRequest.data) {
    throw new Error("El socio ya tiene una membresia activa.");
  }

  const cycle = resolveCycleWindow({
    durationDays: plan.data.duration_days,
    cycleStartsOn: parsed.cycleStartsOn,
    cycleEndsOn: parsed.cycleEndsOn,
    bonusDays: (plan.data as MembershipPlan).bonus_days,
  });

  const membershipPlan = plan.data as MembershipPlan;

  const { data, error } = await client
    .from("membership_requests")
    .insert({
      request_number: generateMembershipRequestNumber(),
      member_id: member.data.id,
      supabase_user_id: values.supabaseUserId ?? member.data.supabase_user_id,
      membership_plan_id: membershipPlan.id,
      email: normalizeEmail(member.data.email),
      plan_title_snapshot: membershipPlan.title,
      price_amount: membershipPlan.price_amount,
      currency_code: membershipPlan.currency_code,
      billing_label: membershipPlan.billing_label,
      duration_days: membershipPlan.duration_days,
      source: parsed.source,
      notes: trimToNull(parsed.notes),
      cycle_starts_on: cycle.cycleStartsOn,
      cycle_ends_on: cycle.cycleEndsOn,
      renews_from_request_id: parsed.renewsFromRequestId ?? latestRequest.data?.id ?? null,
      manual_balance_due: membershipPlan.price_amount,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncMemberProfileMembership(client, {
    memberId: member.data.id,
    membershipPlanId: membershipPlan.id,
    status: member.data.status === "prospect" ? "prospect" : member.data.status,
  });

  await syncMembershipRequestToMedusa(data.id);

  const refreshedBeforeEmail = await getMembershipRequestRowById(client, data.id);

  if (!refreshedBeforeEmail) {
    throw new Error("La solicitud de membresia se creo, pero no se pudo recargar su estado.");
  }

  const detailBeforeEmail = await buildMembershipRequestDetail(client, refreshedBeforeEmail);
  await sendMembershipRequestEmailIfPossible(client, detailBeforeEmail);

  const refreshedAfterEmail = await getMembershipRequestRowById(client, data.id);

  if (!refreshedAfterEmail) {
    throw new Error("La solicitud de membresia se creo, pero no se pudo recargar su estado.");
  }

  return buildMembershipRequestDetail(client, refreshedAfterEmail);
}

export async function listMembershipRequests(filters?: MembershipRequestListFilters) {
  const client = createSupabaseAdminClient();
  let query = client
    .from("membership_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.memberId) {
    query = query.eq("member_id", filters.memberId);
  }

  if (filters?.supabaseUserId) {
    query = query.eq("supabase_user_id", filters.supabaseUserId);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
  }

  if (filters?.q?.trim()) {
    const term = filters.q.trim();
    query = query.or(
      `request_number.ilike.%${term}%,email.ilike.%${term}%,plan_title_snapshot.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const requests = (data ?? []) as MembershipRequestRow[];
  const memberMap = await listMemberProfilesByIds(
    client,
    [...new Set(requests.map((request) => request.member_id))],
  );
  const planMap = await listMembershipPlansByIds(
    client,
    [...new Set(requests.map((request) => request.membership_plan_id))],
  );
  const trainerNameMap = await listTrainerNamesByIds(
    client,
    [
      ...new Set(
        Array.from(memberMap.values())
          .map((member) => member.trainer_user_id)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
  );

  return requests
    .map((request) => {
      const member = memberMap.get(request.member_id);
      const plan = planMap.get(request.membership_plan_id);

      if (!member || !plan) {
        return null;
      }

      return mapMembershipRequestDetail({
        request,
        member,
        plan,
        trainerName: member.trainer_user_id
          ? trainerNameMap.get(member.trainer_user_id) ?? null
          : null,
      });
    })
    .filter((value): value is MembershipRequestDetail => Boolean(value));
}

export async function getMembershipRequestById(id: string) {
  const client = createSupabaseAdminClient();
  const row = await getMembershipRequestRowById(client, id);

  if (!row) {
    return null;
  }

  return buildMembershipRequestDetail(client, row);
}

export async function getMemberOwnedMembershipRequestById(input: {
  id: string;
  supabaseUserId: string;
}) {
  const detail = await getMembershipRequestById(input.id);

  if (!detail || detail.supabaseUserId !== input.supabaseUserId) {
    return null;
  }

  return detail;
}

export async function getLatestMembershipRequestForUser(supabaseUserId: string) {
  const requests = await listMembershipRequests({
    supabaseUserId,
  });

  return requests[0] ?? null;
}

export async function getLatestMembershipRequestForMember(memberId: string) {
  const requests = await listMembershipRequests({
    memberId,
  });

  return requests[0] ?? null;
}

export async function listMembershipRequestAnnotations(membershipRequestId: string) {
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("membership_request_annotations")
    .select("*")
    .eq("membership_request_id", membershipRequestId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    mapMembershipAnnotation(row as MembershipAnnotationRow),
  );
}

export async function addMembershipRequestAnnotation(input: {
  createdByEmail?: string | null;
  createdByUserId?: string | null;
  membershipRequestId: string;
  values: MembershipRequestAnnotationInput;
}) {
  const parsed = membershipRequestAnnotationSchema.parse(input.values);
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("membership_request_annotations")
    .insert({
      membership_request_id: input.membershipRequestId,
      content: parsed.content,
      created_by_email: input.createdByEmail ?? null,
      created_by_user_id: input.createdByUserId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapMembershipAnnotation(data as MembershipAnnotationRow);
}

export async function listMembershipPaymentEntries(membershipRequestId: string) {
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("membership_payment_entries")
    .select("*")
    .eq("membership_request_id", membershipRequestId)
    .order("recorded_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapMembershipPaymentEntry(row as MembershipPaymentEntryRow));
}

export async function addMembershipPaymentEntry(input: {
  createdByEmail?: string | null;
  createdByUserId?: string | null;
  membershipRequestId: string;
  values: MembershipPaymentEntryInput;
}) {
  const parsed = membershipPaymentEntrySchema.parse(input.values);
  const client = createSupabaseAdminClient();
  const request = await getMembershipRequestRowById(client, input.membershipRequestId);

  if (!request) {
    throw new Error("La solicitud de membresia ya no existe.");
  }

  // Se permite el registro de pagos incluso si el saldo es 0 o negativo (sobrepago/ajuste manual)
  // Eliminamos el bloqueo duro anterior para dar flexibilidad operativa a recepcion.

  const { data, error } = await client
    .from("membership_payment_entries")
    .insert({
      membership_request_id: input.membershipRequestId,
      amount: parsed.amount,
      currency_code: request.currency_code,
      note: trimToNull(parsed.note),
      created_by_email: input.createdByEmail ?? null,
      created_by_user_id: input.createdByUserId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await maybePromoteMembershipRequestToActive(client, input.membershipRequestId);

  return mapMembershipPaymentEntry(data as MembershipPaymentEntryRow);
}

export async function updateMembershipRequestStatus(
  membershipRequestId: string,
  status: MembershipRequestStatus,
) {
  const parsedStatus = membershipRequestStatusSchema.parse(status);
  const client = createSupabaseAdminClient();
  const request = await getMembershipRequestRowById(client, membershipRequestId);

  if (!request) {
    throw new Error("La solicitud de membresia ya no existe.");
  }

  const patch: Partial<DBMembershipRequest> = {
    status: parsedStatus,
  };

  if (parsedStatus === "active" && !request.activated_at) {
    patch.activated_at = new Date().toISOString();
  }

  const { error } = await client
    .from("membership_requests")
    .update(patch)
    .eq("id", membershipRequestId);

  if (error) {
    throw new Error(error.message);
  }

  if (parsedStatus === "active") {
    await syncMemberProfileMembership(client, {
      memberId: request.member_id,
      membershipPlanId: request.membership_plan_id,
      status: "active",
    });
  } else if (parsedStatus === "paused") {
    await syncMemberProfileMembership(client, {
      memberId: request.member_id,
      membershipPlanId: request.membership_plan_id,
      status: "paused",
    });
  }
}

export async function updateMembershipRequestDates(
  membershipRequestId: string,
  input: MembershipRequestDatesInput,
) {
  const parsed = membershipRequestDatesSchema.parse(input);
  const client = createSupabaseAdminClient();
  
  const { error } = await client
    .from("membership_requests")
    .update({
      cycle_starts_on: parsed.cycleStartsOn,
      cycle_ends_on: parsed.cycleEndsOn,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membershipRequestId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteMembershipRequest(membershipRequestId: string) {
  const client = createSupabaseAdminClient();
  const request = await getMembershipRequestRowById(client, membershipRequestId);

  if (!request) {
    throw new Error("La solicitud de membresia ya no existe.");
  }

  const requestStatus = membershipRequestStatusSchema.parse(request.status);
  const { error } = await client.from("membership_requests").delete().eq("id", membershipRequestId);

  if (error) {
    throw new Error(error.message);
  }

  const latestRemainingRequest = await getLatestMembershipRequestRowForMember(client, request.member_id);

  if (latestRemainingRequest) {
    await syncMemberProfileMembership(client, {
      memberId: request.member_id,
      membershipPlanId: latestRemainingRequest.membership_plan_id,
      status: mapMembershipRequestStatusToMemberStatus(
        membershipRequestStatusSchema.parse(latestRemainingRequest.status),
      ),
    });
  } else {
    await syncMemberProfileMembership(client, {
      memberId: request.member_id,
      membershipPlanId: null,
      status: getFallbackMemberStatusAfterMembershipDeletion(requestStatus),
    });
  }

  return {
    id: request.id,
    memberId: request.member_id,
  };
}

export async function getPublicMembershipStatusByToken(
  token: string,
): Promise<MembershipPublicStatus | null> {
  const client = createSupabaseAdminClient();
  const { data: member, error } = await client
    .from("member_profiles")
    .select("*")
    .eq("membership_qr_token", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!member) {
    return null;
  }

  const [currentRequest, plan] = await Promise.all([
    client
      .from("membership_requests")
      .select("*")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    member.membership_plan_id
      ? client
          .from("membership_plans")
          .select("*")
          .eq("id", member.membership_plan_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (currentRequest.error) {
    throw new Error(currentRequest.error.message);
  }

  if (plan.error) {
    throw new Error(plan.error.message);
  }

  const validation = deriveMembershipValidation({
    cycleEndsOn: currentRequest.data?.cycle_ends_on ?? null,
    cycleStartsOn: currentRequest.data?.cycle_starts_on ?? null,
    manualPaymentStatus:
      currentRequest.data?.manual_payment_status === "partial" ||
      currentRequest.data?.manual_payment_status === "paid" ||
      currentRequest.data?.manual_payment_status === "overpaid"
        ? currentRequest.data.manual_payment_status
        : "pending",
    requestStatus:
      currentRequest.data?.status &&
      ["requested", "confirmed", "active", "paused", "expired", "cancelled"].includes(
        currentRequest.data.status,
      )
        ? (currentRequest.data.status as MembershipRequestStatus)
        : "expired",
  });

  return {
    isCurrentlyValid: validation.status === "al_dia",
    member: {
      fullName: member.full_name,
      memberNumber: member.member_number,
    },
    planTitle:
      currentRequest.data?.plan_title_snapshot ??
      plan.data?.title ??
      "Sin membresia operativa",
    validation,
    requestNumber: currentRequest.data?.request_number ?? null,
    qrUrl: new URL(`/validacion/membresia/${token}`, SITE_URL).toString(),
  };
}

export async function getMembershipValidationByToken(token: string) {
  return getPublicMembershipStatusByToken(token);
}

export function buildMembershipValidationUrl(token: string) {
  return buildMembershipQrPublicValidationUrl(SITE_URL, token);
}

export function parseMembershipQrScanToken(input: string) {
  return parseMembershipQrScannedValue(input);
}

export async function activateMembershipQr(membershipRequestId: string) {
  const client = createSupabaseAdminClient();
  const request = await getMembershipRequestRowById(client, membershipRequestId);

  if (!request) {
    throw new Error("La solicitud de membresia ya no existe.");
  }

  const member = await getMemberProfileById(client, request.member_id);
  if (!member) {
    throw new Error("No se encontro la ficha del socio.");
  }

  return await ensureMemberProfileQrToken(client, member);
}

export async function getDashboardMembershipScanResultByToken(token: string) {
  const client = createSupabaseAdminClient();
  const { data: member, error } = await client
    .from("member_profiles")
    .select("*")
    .eq("membership_qr_token", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!member) {
    return null;
  }

  const [latestRequestRow, planMap, trainerNameMap] = await Promise.all([
    getLatestMembershipRequestRowForMember(client, member.id),
    member.membership_plan_id
      ? listMembershipPlansByIds(client, [member.membership_plan_id])
      : Promise.resolve(new Map<string, DBMembershipPlan>()),
    listTrainerNamesByIds(client, member.trainer_user_id ? [member.trainer_user_id] : []),
  ]);
  const latestRequest = latestRequestRow
    ? await buildMembershipRequestDetail(client, latestRequestRow)
    : null;

  const memberSummary = mapMembershipMemberSummary({
    member: member as DBMemberProfile,
    trainerName: member.trainer_user_id ? trainerNameMap.get(member.trainer_user_id) ?? null : null,
  });
  const fallbackPlan = member.membership_plan_id ? planMap.get(member.membership_plan_id) ?? null : null;

  return {
    cycleEndsOn: latestRequest?.cycleEndsOn ?? null,
    cycleStartsOn: latestRequest?.cycleStartsOn ?? null,
    member: memberSummary,
    membershipRequestId: latestRequest?.id ?? null,
    planTitle: latestRequest?.planTitleSnapshot ?? fallbackPlan?.title ?? "Sin membresia operativa",
    publicValidationUrl: buildMembershipValidationUrl(token),
    requestNumber: latestRequest?.requestNumber ?? null,
    requestStatus: latestRequest?.status ?? null,
    validation: latestRequest?.validation ?? null,
  } satisfies MembershipReceptionScanResult;
}
