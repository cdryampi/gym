"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  saveCmsDocumentRecord,
  saveMarketingContentRecord,
  saveSiteSettingsRecord,
  updateLeadFollowUpRecord,
  updateLeadStatusRecord,
} from "@/lib/supabase/queries";
import { cmsDocumentSchema, type CmsDocumentValues } from "@/lib/validators/cms-document";
import { leadFollowUpSchema, type LeadFollowUpValues, leadStatusSchema } from "@/lib/validators/lead";
import { marketingContentSchema, type MarketingContentValues } from "@/lib/validators/marketing";
import { siteSettingsSchema, type SiteSettingsValues } from "@/lib/validators/settings";

async function getAuthenticatedSupabase() {
  await requireAdminUser();

  if (!hasSupabaseServiceRole()) {
    throw new Error(
      "Configura SUPABASE_SERVICE_ROLE_KEY para gestionar datos reales del backoffice.",
    );
  }

  return createSupabaseAdminClient();
}

function revalidateApp() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cms");
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/marketing");
  revalidatePath("/dashboard/web");
  revalidatePath("/dashboard/info");
  revalidatePath("/dashboard/advanced");
  revalidatePath("/planes");
  revalidatePath("/horarios");
  revalidatePath("/privacidad");
  revalidatePath("/cookies");
  revalidatePath("/terminos");
  revalidatePath("/desistimiento");
  revalidatePath("/aviso-legal");
  revalidatePath("/acceso-restringido");
  revalidatePath("/tienda");
  revalidatePath("/carrito");
}

export async function saveSiteSettings(values: SiteSettingsValues) {
  const parsed = siteSettingsSchema.parse(values);
  const supabase = await getAuthenticatedSupabase();
  await saveSiteSettingsRecord(supabase, parsed);
  revalidateApp();
}

export type ActionResponse = {
  success: boolean;
  error?: string;
};

export async function saveMarketingContent(values: MarketingContentValues): Promise<ActionResponse> {
  try {
    const parsed = marketingContentSchema.parse(values);
    const supabase = await getAuthenticatedSupabase();

    await saveMarketingContentRecord(supabase, parsed);
    revalidateApp();

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido al guardar marketing.";
    console.error("[saveMarketingContent] Error persistence:", {
      message,
      error,
    });
    
    return { 
      success: false, 
      error: message 
    };
  }
}

export async function updateLeadStatus(id: string, status: "new" | "contacted" | "closed") {
  const parsed = leadStatusSchema.parse({ status });
  const supabase = await getAuthenticatedSupabase();
  await updateLeadStatusRecord(supabase, id, parsed.status);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
}

export async function saveLeadFollowUp(id: string, values: LeadFollowUpValues) {
  const parsed = leadFollowUpSchema.parse(values);
  const supabase = await getAuthenticatedSupabase();
  await updateLeadFollowUpRecord(supabase, id, parsed);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
}

export async function saveCmsDocument(values: CmsDocumentValues) {
  const parsed = cmsDocumentSchema.parse(values);
  const supabase = await getAuthenticatedSupabase();
  await saveCmsDocumentRecord(supabase, parsed);
  revalidateApp();
}
