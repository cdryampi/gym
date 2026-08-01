import { NextResponse } from "next/server";

import {
  getDashboardMembershipScanResultByToken,
  parseMembershipQrScanToken,
} from "@/lib/data/memberships";
import { getServerSupabaseEnv } from "@/lib/env";
import {
  createMembershipQrErrorResponse,
  isMembershipQrValidationResponse,
  type MembershipQrValidationResponse,
  MEMBERSHIP_QR_UUID_PATTERN,
} from "@/lib/membership-qr";
import { SITE_URL } from "@/lib/seo";

import type { AuthUser } from "@/lib/auth-user";
import { type LocalAdminUser } from "@/lib/auth";
import { requireRoles, validateRequestOrigin, withApiErrorHandling } from "@/lib/api-utils";
import { DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE, TRAINER_ROLE } from "@/lib/user-roles";

function resolveDashboardUserHeaders(user: AuthUser | LocalAdminUser) {
  const userId =
    "id" in user && typeof user.id === "string" && MEMBERSHIP_QR_UUID_PATTERN.test(user.id)
      ? user.id
      : "";
  const userEmail =
    "email" in user && typeof user.email === "string" ? user.email : "";

  return {
    userId,
    userEmail,
  };
}

async function resolveMembershipQrFallback(scannedValue: string) {
  const parsedToken = parseMembershipQrScanToken(scannedValue);

  if (!parsedToken) {
    return {
      status: "blocked",
      reasonCode: "invalid_format",
      canEnter: false,
      validationLabel: "QR no reconocido",
      member: null,
      membershipRequest: null,
      publicValidationUrl: null,
      scannedToken: null,
      errorMessage: null,
    } satisfies MembershipQrValidationResponse;
  }

  const result = await getDashboardMembershipScanResultByToken(parsedToken);

  if (!result) {
    return {
      status: "blocked",
      reasonCode: "member_not_found",
      canEnter: false,
      validationLabel: "QR sin socio vinculado",
      member: null,
      membershipRequest: null,
      publicValidationUrl: null,
      scannedToken: parsedToken,
      errorMessage: null,
    } satisfies MembershipQrValidationResponse;
  }

  const requestStatus = result.requestStatus;
  const validationStatus = result.validation?.status ?? null;

  const reasonCode =
    validationStatus === "al_dia"
      ? "ok"
      : validationStatus === "vencido"
        ? "expired_membership"
        : requestStatus === "paused" || requestStatus === "cancelled" || !result.membershipRequestId
          ? "inactive_membership"
          : "payment_pending";
  const canEnter = reasonCode === "ok";

  return {
    status: canEnter ? "ok" : "blocked",
    reasonCode,
    canEnter,
    validationLabel:
      result.validation?.label ??
      (reasonCode === "inactive_membership"
        ? "Socio sin membresia operativa"
        : "Pago o activacion pendiente"),
    member: {
      id: result.member.id,
      memberNumber: result.member.memberNumber,
      fullName: result.member.fullName,
      email: result.member.email,
      phone: result.member.phone,
      status: result.member.status,
      branchName: result.member.branchName,
      trainerName: result.member.trainerName,
      membershipQrToken: result.member.membershipQrToken,
      planTitle: result.planTitle,
    },
    membershipRequest: result.membershipRequestId
      ? {
          id: result.membershipRequestId,
          requestNumber: result.requestNumber ?? "Sin numero",
          status: result.requestStatus ?? "requested",
          cycleStartsOn: result.cycleStartsOn,
          cycleEndsOn: result.cycleEndsOn,
          planTitle: result.planTitle,
        }
      : null,
    publicValidationUrl: result.publicValidationUrl,
    scannedToken: parsedToken,
    errorMessage: null,
  } satisfies MembershipQrValidationResponse;
}

export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    const originCheck = validateRequestOrigin(request);
    if (!originCheck.success) return originCheck.errorResponse;

    const auth = await requireRoles([TRAINER_ROLE, DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE]);
    if (!auth.success) return auth.errorResponse;
    const user = auth.user;

    const { serviceRoleKey, url } = getServerSupabaseEnv();

    if (!serviceRoleKey) {
      return NextResponse.json(
        createMembershipQrErrorResponse({
          errorMessage:
            "Falta SUPABASE_SERVICE_ROLE_KEY para conectar el dashboard con la validacion QR.",
        }),
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const scannedValue =
      typeof body?.scannedValue === "string" ? body.scannedValue.trim() : "";

    if (!scannedValue) {
      return NextResponse.json(
        createMembershipQrErrorResponse({
          errorMessage: "Escanea un QR valido antes de continuar.",
          validationLabel: "Lectura vacia",
        }),
        { status: 400 },
      );
    }

    const { userEmail, userId } = resolveDashboardUserHeaders(user);

    try {
      const functionResponse = await fetch(`${url}/functions/v1/membership-qr-validate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          "x-dashboard-user-email": userEmail,
          "x-dashboard-user-id": userId,
          "x-site-url": SITE_URL,
        },
        body: JSON.stringify({
          scannedValue,
        }),
        cache: "no-store",
      });

      const payload = await functionResponse.json().catch(() => null);

      if (!isMembershipQrValidationResponse(payload)) {
        if (functionResponse.status === 404) {
          const fallback = await resolveMembershipQrFallback(scannedValue);
          return NextResponse.json(fallback, { status: fallback.canEnter ? 200 : 422 });
        }

        const fallback = await resolveMembershipQrFallback(scannedValue).catch(() => null);

        if (fallback) {
          return NextResponse.json(fallback, { status: fallback.canEnter ? 200 : 422 });
        }

        return NextResponse.json(
          createMembershipQrErrorResponse({
            errorMessage:
              "Supabase devolvio una respuesta invalida durante la validacion QR.",
          }),
          { status: 502 },
        );
      }

      return NextResponse.json(payload, {
        status:
          payload.status === "ok"
            ? 200
            : payload.reasonCode === "forbidden"
              ? 403
              : payload.status === "error"
                ? 503
                : 422,
      });
    } catch (error) {
      const fallback = await resolveMembershipQrFallback(scannedValue).catch(() => null);

      if (fallback) {
        return NextResponse.json(fallback, { status: fallback.canEnter ? 200 : 422 });
      }

      return NextResponse.json(
        createMembershipQrErrorResponse({
          errorMessage:
            process.env.NODE_ENV === "production"
              ? "No se pudo contactar con la validacion QR de Supabase."
              : error instanceof Error
                ? error.message
                : "No se pudo contactar con la validacion QR de Supabase.",
        }),
        { status: 503 },
      );
    }
  });
}
