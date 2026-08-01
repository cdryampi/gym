import { createClient } from "npm:@supabase/supabase-js@2.99.1";

import {
  buildMembershipQrPublicValidationUrl,
  createMembershipQrErrorResponse,
  parseMembershipQrScannedValue,
  resolveMembershipQrValidation,
  shouldPromoteMembershipRequestToActive,
  type MembershipQrManualPaymentStatus,
  type MembershipQrRequestStatus,
  type MembershipQrValidationMember,
  type MembershipQrValidationMembershipRequest,
} from "../../../src/lib/membership-qr.ts";

interface MemberRow {
  branch_name: string | null;
  email: string;
  full_name: string;
  id: string;
  member_number: string;
  membership_plan_id: string | null;
  membership_qr_token: string;
  phone: string | null;
  status: string;
  trainer_user_id: string | null;
}

interface MembershipRequestRow {
  activated_at: string | null;
  cycle_ends_on: string | null;
  cycle_starts_on: string | null;
  id: string;
  manual_payment_status: MembershipQrManualPaymentStatus;
  membership_plan_id: string;
  plan_title_snapshot: string | null;
  request_number: string;
  status: MembershipQrRequestStatus;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function resolveInjectedSecretKey() {
  const directSecret = Deno.env.get("SUPABASE_SECRET_KEY")?.trim();

  if (directSecret) {
    return directSecret;
  }

  const injectedSecrets = Deno.env.get("SUPABASE_SECRET_KEYS")?.trim();

  if (!injectedSecrets) {
    return "";
  }

  try {
    const parsed = JSON.parse(injectedSecrets) as Record<string, unknown>;
    return typeof parsed.default === "string" ? parsed.default.trim() : "";
  } catch {
    return "";
  }
}

function secretsMatch(received: string, expected: string) {
  if (received.length !== expected.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < received.length; index += 1) {
    difference |= received.charCodeAt(index) ^ expected.charCodeAt(index);
  }

  return difference === 0;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const secretKey = resolveInjectedSecretKey();

  if (!supabaseUrl || !secretKey) {
    return json(
      createMembershipQrErrorResponse({
        errorMessage:
          "Falta configurar SUPABASE_URL o SUPABASE_SECRET_KEY para validar QR.",
      }),
      500,
    );
  }

  if (request.method !== "POST") {
    return json(
      createMembershipQrErrorResponse({
        errorMessage: "Metodo no permitido para validacion QR.",
        validationLabel: "Operacion no permitida",
      }),
      405,
    );
  }

  const callerKey = request.headers.get("apikey")?.trim() ?? "";

  if (!callerKey || !secretsMatch(callerKey, secretKey)) {
    return json(
      createMembershipQrErrorResponse({
        errorMessage: "Solo el dashboard autenticado puede invocar esta validacion QR.",
        reasonCode: "forbidden",
        validationLabel: "Acceso restringido",
      }),
      403,
    );
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const body = await request.json().catch(() => ({}));
  const scannedValue =
    typeof body?.scannedValue === "string" ? body.scannedValue.trim() : "";

  if (!scannedValue) {
    return json(
      createMembershipQrErrorResponse({
        errorMessage: "Necesitamos un valor escaneado para validar el QR.",
        validationLabel: "Lectura vacia",
      }),
      400,
    );
  }

  const scannedToken = parseMembershipQrScannedValue(scannedValue);
  const siteUrl = request.headers.get("x-site-url")?.trim() ?? "";
  const staffUserId = request.headers.get("x-dashboard-user-id")?.trim() || null;
  const staffEmail = request.headers.get("x-dashboard-user-email")?.trim() || null;

  try {
    let memberPayload: MembershipQrValidationMember | null = null;
    let requestPayload: MembershipQrValidationMembershipRequest | null = null;

    if (scannedToken) {
      const { data: member, error: memberError } = await supabase
        .from("member_profiles")
        .select(
          "id, member_number, full_name, email, phone, status, branch_name, trainer_user_id, membership_plan_id, membership_qr_token",
        )
        .eq("membership_qr_token", scannedToken)
        .maybeSingle();

      if (memberError) {
        throw new Error(memberError.message);
      }

      const memberRow = (member ?? null) as MemberRow | null;

      if (memberRow) {
        const [trainerResult, latestRequestResult, planResult] = await Promise.all([
          memberRow.trainer_user_id
            ? supabase
                .from("trainer_profiles")
                .select("display_name")
                .eq("user_id", memberRow.trainer_user_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          supabase
            .from("membership_requests")
            .select(
              "id, request_number, status, cycle_starts_on, cycle_ends_on, plan_title_snapshot, manual_payment_status, membership_plan_id, activated_at",
            )
            .eq("member_id", memberRow.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          memberRow.membership_plan_id
            ? supabase
                .from("membership_plans")
                .select("title")
                .eq("id", memberRow.membership_plan_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (trainerResult.error) {
          throw new Error(trainerResult.error.message);
        }

        if (latestRequestResult.error) {
          throw new Error(latestRequestResult.error.message);
        }

        if (planResult.error) {
          throw new Error(planResult.error.message);
        }

        const trainerName =
          trainerResult.data && typeof trainerResult.data.display_name === "string"
            ? trainerResult.data.display_name
            : null;
        const fallbackPlanTitle =
          planResult.data && typeof planResult.data.title === "string"
            ? planResult.data.title
            : null;

        memberPayload = {
          id: memberRow.id,
          memberNumber: memberRow.member_number,
          fullName: memberRow.full_name,
          email: memberRow.email,
          phone: memberRow.phone,
          status: memberRow.status,
          branchName: memberRow.branch_name,
          trainerName,
          membershipQrToken: memberRow.membership_qr_token,
          planTitle: fallbackPlanTitle,
        };

        const latestRequest = (latestRequestResult.data ?? null) as MembershipRequestRow | null;

        if (latestRequest) {
          let requestRow = latestRequest;

          if (
            shouldPromoteMembershipRequestToActive({
              manualPaymentStatus: requestRow.manual_payment_status,
              status: requestRow.status,
            })
          ) {
            const activatedAt = requestRow.activated_at ?? new Date().toISOString();
            const { error: requestUpdateError } = await supabase
              .from("membership_requests")
              .update({
                status: "active",
                activated_at: activatedAt,
              })
              .eq("id", requestRow.id);

            if (requestUpdateError) {
              throw new Error(requestUpdateError.message);
            }

            const { error: memberUpdateError } = await supabase
              .from("member_profiles")
              .update({
                membership_plan_id: requestRow.membership_plan_id,
                status: "active",
              })
              .eq("id", memberRow.id);

            if (memberUpdateError) {
              throw new Error(memberUpdateError.message);
            }

            requestRow = {
              ...requestRow,
              status: "active",
              activated_at: activatedAt,
            };
            memberPayload = {
              ...memberPayload,
              status: "active",
            };
          }

          requestPayload = {
            id: requestRow.id,
            requestNumber: requestRow.request_number,
            status: requestRow.status,
            cycleStartsOn: requestRow.cycle_starts_on,
            cycleEndsOn: requestRow.cycle_ends_on,
            planTitle:
              requestRow.plan_title_snapshot?.trim() || fallbackPlanTitle || "Sin membresia operativa",
          };
        }
      }
    }

    const validation = resolveMembershipQrValidation({
      scannedValue,
      scannedToken,
      member: memberPayload,
      membershipRequest: requestPayload,
      publicValidationUrl:
        scannedToken && siteUrl
          ? buildMembershipQrPublicValidationUrl(siteUrl, scannedToken)
          : null,
    });

    const { error: eventError } = await supabase.from("membership_qr_scan_events").insert({
      scanned_value_hash: await sha256(scannedValue),
      normalized_token: validation.scannedToken,
      result_code: validation.reasonCode,
      can_enter: validation.canEnter,
      member_id: validation.member?.id ?? null,
      membership_request_id: validation.membershipRequest?.id ?? null,
      staff_user_id: staffUserId,
      staff_email: staffEmail,
      details: {
        source: "dashboard-reception",
        status: validation.status,
        validation_label: validation.validationLabel,
      },
    });

    if (eventError) {
      throw new Error(eventError.message);
    }

    return json(validation, validation.status === "ok" ? 200 : 422);
  } catch (error) {
    return json(
      createMembershipQrErrorResponse({
        errorMessage:
          error instanceof Error
            ? error.message
            : "La validacion QR de Supabase no pudo completarse.",
      }),
      500,
    );
  }
});
