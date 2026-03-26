"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import { mapPickupRequest } from "@/lib/cart/pickup-request";
import type { PickupRequestStatus } from "@/lib/cart/types";
import { getStoreAdminRepository } from "@/lib/data/store-admin/repository";
import { getStoreAdminWriteDisabledReason } from "@/lib/data/store-admin";
import {
  markPickupRequestEmailResult,
  retrievePickupRequest,
  syncPickupRequestFromOrder,
  updatePickupRequestStatus,
} from "@/lib/cart/member-bridge";
import { getMarketingData } from "@/lib/data/site";
import { defaultSiteSettings } from "@/lib/data/default-content";
import { getResendEnv, hasMedusaAdminEnv } from "@/lib/env";
import { resolveTransactionalSender } from "@/lib/email/policy";
import { sendPickupRequestEmails } from "@/lib/email/pickup-request";
import {
  storeCategorySchema,
  storeProductSchema,
  type StoreCategoryInput,
  type StoreProductInput,
} from "@/lib/validators/store";

async function getAuthenticatedStoreAdminRepository() {
  await requireAdminUser();

  const disabledReason = getStoreAdminWriteDisabledReason();
  if (disabledReason) {
    throw new Error(disabledReason);
  }

  return getStoreAdminRepository();
}

function revalidateStore() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tienda");
  revalidatePath("/dashboard/tienda/categorias");
  revalidatePath("/dashboard/tienda/productos");
  revalidatePath("/dashboard/tienda/pedidos");
  revalidatePath("/tienda");
}

async function assertPickupRequestsAdminReady() {
  await requireAdminUser();

  if (!hasMedusaAdminEnv()) {
    throw new Error(
      "Configura MEDUSA_ADMIN_API_KEY y MEDUSA_BACKEND_URL (o NEXT_PUBLIC_MEDUSA_BACKEND_URL) para operar pedidos pickup.",
    );
  }
}

export async function saveStoreCategory(values: StoreCategoryInput, categoryId?: string) {
  const parsed = storeCategorySchema.parse(values);
  const repository = await getAuthenticatedStoreAdminRepository();
  const id = await repository.saveCategory(parsed, categoryId);
  revalidateStore();
  return id;
}

export async function saveStoreProduct(values: StoreProductInput, productId?: string) {
  const parsed = storeProductSchema.parse(values);
  const repository = await getAuthenticatedStoreAdminRepository();
  const id = await repository.saveProduct(parsed, productId);
  revalidateStore();
  return id;
}

export async function deactivateStoreCategory(id: string) {
  const repository = await getAuthenticatedStoreAdminRepository();
  await repository.deactivateCategory(id);
  revalidateStore();
}

export async function deactivateStoreProduct(id: string) {
  const repository = await getAuthenticatedStoreAdminRepository();
  await repository.deactivateProduct(id);
  revalidateStore();
}

export async function deleteStoreCategory(id: string) {
  const repository = await getAuthenticatedStoreAdminRepository();
  await repository.deleteCategory(id);
  revalidateStore();
}

export async function deleteStoreProduct(id: string) {
  const repository = await getAuthenticatedStoreAdminRepository();
  await repository.deleteProduct(id);
  revalidateStore();
}

export async function updateDashboardPickupRequestStatus(
  pickupRequestId: string,
  status: PickupRequestStatus,
) {
  await assertPickupRequestsAdminReady();
  await updatePickupRequestStatus(pickupRequestId, status);
  revalidateStore();
  revalidatePath(`/dashboard/tienda/pedidos/${pickupRequestId}`);
  revalidatePath("/mi-cuenta");
}

export async function resendDashboardPickupRequestEmail(pickupRequestId: string) {
  await assertPickupRequestsAdminReady();

  const pickupRequestResponse = await retrievePickupRequest(pickupRequestId);
  const pickupRequest = mapPickupRequest(pickupRequestResponse.pickup_request);
  const { settings } = await getMarketingData();
  const siteName = settings.site_name ?? defaultSiteSettings.site_name;
  const internalRecipient =
    settings.notification_email ?? defaultSiteSettings.notification_email;
  const resend = getResendEnv();
  const sender = resolveTransactionalSender(
    siteName,
    settings.transactional_from_email ?? defaultSiteSettings.transactional_from_email,
    resend.fromEmail,
  );

  try {
    await sendPickupRequestEmails({
      pickupRequest,
      siteName,
      internalRecipient,
      fromEmail: sender.fromEmail,
      replyTo: sender.replyTo,
    });

    try {
      await markPickupRequestEmailResult(pickupRequestId, {
        emailStatus: "sent",
        emailSentAt: new Date().toISOString(),
      });
    } catch (markError) {
      console.warn(
        "[Pickup Request Email] El email se envio, pero no se pudo registrar el estado en Medusa:",
        markError instanceof Error ? markError.message : String(markError),
      );
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo reenviar el email del pedido pickup.";

    try {
      await markPickupRequestEmailResult(pickupRequestId, {
        emailStatus: "failed",
        emailError: message,
      });
    } catch (markError) {
      console.warn(
        "[Pickup Request Email] No se pudo registrar el fallo del email en Medusa:",
        markError instanceof Error ? markError.message : String(markError),
      );
    }

    throw new Error(message);
  }

  revalidatePath(`/dashboard/tienda/pedidos/${pickupRequestId}`);
  revalidatePath("/mi-cuenta");
}

export async function syncPickupRequestFromMedusaOrderAction(
  pickupRequestId: string,
  cartId: string,
  orderId: string,
) {
  await assertPickupRequestsAdminReady();

  try {
    await syncPickupRequestFromOrder(cartId, {
      orderId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo sincronizar el pedido pickup manualmente.";

    throw new Error(message);
  }

  revalidateStore();
  revalidatePath(`/dashboard/tienda/pedidos/${pickupRequestId}`);
}
