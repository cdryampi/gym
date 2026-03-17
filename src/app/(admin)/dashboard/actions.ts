"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { saveSiteSettingsRecord, updateLeadStatusRecord } from "@/lib/supabase/queries";
import { leadStatusSchema } from "@/lib/validators/lead";
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
  revalidatePath("/dashboard/content");
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/settings");
}

export async function saveSiteSettings(values: SiteSettingsValues) {
  const parsed = siteSettingsSchema.parse(values);
  const supabase = await getAuthenticatedSupabase();
  await saveSiteSettingsRecord(supabase, parsed);
  revalidateApp();
}

export async function updateLeadStatus(id: string, status: "new" | "contacted" | "closed") {
  const parsed = leadStatusSchema.parse({ status });
  const supabase = await getAuthenticatedSupabase();
  await updateLeadStatusRecord(supabase, id, parsed.status);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
}
