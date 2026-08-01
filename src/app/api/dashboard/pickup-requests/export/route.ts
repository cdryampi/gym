import { NextRequest, NextResponse } from "next/server";

import { requireRoles, withApiErrorHandling } from "@/lib/api-utils";
import { mapPickupRequest } from "@/lib/cart/pickup-request";
import { listPickupRequests } from "@/lib/cart/member-bridge";
import {
  filterAndSortPickupRequests,
  parsePickupRequestFilters,
} from "@/lib/data/pickup-request-dashboard";
import { listPickupRequestManualPaymentSummaries } from "@/lib/data/pickup-requests";
import { hasMedusaAdminEnv, hasSupabaseSecretKey } from "@/lib/env";
import { DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE } from "@/lib/user-roles";

function buildCsvFilename() {
  return `pickup-requests-export-${new Date().toISOString().slice(0, 10)}.csv`;
}

function escapeCsvValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = String(value);

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }

  return normalized;
}

async function loadAllPickupRequests(status: string | null) {
  const limit = 200;
  let offset = 0;
  let count = 0;
  const allPickupRequests = [];

  do {
    const response = await listPickupRequests({
      status,
      limit,
      offset,
    });

    const pagePickupRequests = (response.pickup_requests ?? []).map((pickupRequest) =>
      mapPickupRequest(pickupRequest),
    );

    allPickupRequests.push(...pagePickupRequests);
    count = response.count ?? 0;
    offset += limit;
  } while (offset < count);

  return allPickupRequests;
}

export async function GET(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const auth = await requireRoles([DASHBOARD_ADMIN_ROLE, SUPERADMIN_ROLE]);
    if (!auth.success) return auth.errorResponse;

    if (!hasMedusaAdminEnv()) {
      return NextResponse.json(
        { error: "Configura MEDUSA_ADMIN_API_KEY y MEDUSA_BACKEND_URL para exportar pedidos pickup." },
        { status: 503 },
      );
    }

    if (!hasSupabaseSecretKey()) {
      return NextResponse.json(
        { error: "Configura SUPABASE_SECRET_KEY para exportar pedidos pickup con sus cobros manuales." },
        { status: 503 },
      );
    }

    const filters = parsePickupRequestFilters(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    const pickupRequests = await loadAllPickupRequests(
      filters.status === "all" ? null : filters.status,
    );
    const filteredPickupRequests = filterAndSortPickupRequests(pickupRequests, filters);
    const manualSummaries = await listPickupRequestManualPaymentSummaries(
      filteredPickupRequests.map((pickupRequest) => pickupRequest.id),
    );

    const headers = [
      "referencia",
      "estado",
      "pago_plataforma",
      "email_estado",
      "fecha_creacion",
      "fecha_actualizacion",
      "email_cliente",
      "customer_id",
      "supabase_user_id",
      "cart_id",
      "order_id",
      "items",
      "moneda",
      "total_pedido",
      "manual_payment_status",
      "manual_paid_total",
      "manual_balance_due",
      "manual_payment_entry_count",
      "manual_payment_updated_at",
      "notas_cliente",
    ];

    const rows = filteredPickupRequests.map((pickupRequest) => {
      const manualSummary = manualSummaries[pickupRequest.id];

      return [
        pickupRequest.requestNumber,
        pickupRequest.status,
        pickupRequest.paymentStatus,
        pickupRequest.emailStatus,
        pickupRequest.createdAt,
        pickupRequest.updatedAt,
        pickupRequest.email,
        pickupRequest.customerId,
        pickupRequest.supabaseUserId,
        pickupRequest.cartId,
        pickupRequest.orderId,
        pickupRequest.itemCount,
        pickupRequest.currencyCode,
        pickupRequest.total.toFixed(2),
        manualSummary?.status ?? "pending",
        manualSummary?.paidTotal.toFixed(2) ?? "0.00",
        manualSummary?.balanceDue.toFixed(2) ?? pickupRequest.total.toFixed(2),
        manualSummary?.entryCount ?? 0,
        manualSummary?.updatedAt ?? "",
        pickupRequest.notes ?? "",
      ]
        .map(escapeCsvValue)
        .join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${buildCsvFilename()}"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
