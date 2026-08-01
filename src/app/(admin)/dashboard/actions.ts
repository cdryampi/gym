"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import {
  PUBLIC_CACHE_TAGS,
  revalidatePublicCacheTags,
  type PublicCacheTag,
} from "@/lib/cache/public-cache";
import { hasSupabaseSecretKey } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  moderateMarketingTestimonialRecord,
  saveCmsDocumentRecord,
  saveMarketingContentRecord,
  saveMarketingPlansRecord,
  saveMarketingScheduleRowsRecord,
  saveMarketingTeamMembersRecord,
  saveSiteSettingsRecord,
  updateTrainingZoneRecord,
  updateLeadFollowUpRecord,
  updateLeadStatusRecord,
  deleteLeadRecord,
  updateBrandingRecord,
  updateThemeConfigRecord,
} from "@/lib/supabase/queries";
import { cmsDocumentSchema, type CmsDocumentValues } from "@/lib/validators/cms-document";
import { leadFollowUpSchema, type LeadFollowUpValues, leadStatusSchema } from "@/lib/validators/lead";
import { marketingContentSchema, type MarketingContentValues } from "@/lib/validators/marketing";
import { trainingZoneSchema, type TrainingZoneValues } from "@/lib/validators/training-zone";
import {
  moderateMarketingTestimonialSchema,
  type MarketingTestimonialModerationStatus,
} from "@/lib/validators/marketing-testimonial";
import { siteSettingsSchema, type SiteSettingsValues } from "@/lib/validators/settings";
import { brandingSchema, type BrandingValues } from "@/lib/validators/branding";
import { themeConfigSchema, type ThemeConfig } from "@/lib/validators/theme";


async function getAuthenticatedSupabase() {
  await requireAdminUser();

  if (!hasSupabaseSecretKey()) {
    throw new Error(
      "Configura SUPABASE_SECRET_KEY para gestionar datos reales del backoffice.",
    );
  }

  return createSupabaseAdminClient();
}

function revalidateApp(tags: PublicCacheTag[] = []) {
  if (tags.length > 0) {
    revalidatePublicCacheTags(tags);
  }
}

export async function saveSiteSettings(values: SiteSettingsValues) {
  await requireAdminUser();
  const parsed = siteSettingsSchema.parse(values);
  const supabase = await getAuthenticatedSupabase();
  await saveSiteSettingsRecord(supabase, parsed);
  
  // Revalidacion quirurgica
  revalidateApp([PUBLIC_CACHE_TAGS.marketing]);
  revalidatePath("/dashboard/settings");
}

export type ActionResponse = {
  success: boolean;
  error?: string;
};

export async function saveMarketingContent(values: MarketingContentValues): Promise<ActionResponse> {
  try {
    await requireAdminUser();
    const parsed = marketingContentSchema.parse(values);
    const supabase = await getAuthenticatedSupabase();

    await saveMarketingContentRecord(supabase, parsed);
    revalidateApp([PUBLIC_CACHE_TAGS.marketing]);
    revalidatePath("/dashboard/marketing");

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

export async function saveMarketingPlans(plans: MarketingContentValues["plans"]): Promise<ActionResponse> {
  try {
    await requireAdminUser();
    const supabase = await getAuthenticatedSupabase();
    await saveMarketingPlansRecord(supabase, plans);
    revalidateApp([PUBLIC_CACHE_TAGS.marketing]);
    revalidatePath("/dashboard/marketing/planes");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar los planes.";
    return { success: false, error: message };
  }
}

export async function saveMarketingSchedule(rows: MarketingContentValues["scheduleRows"]): Promise<ActionResponse> {
  try {
    await requireAdminUser();
    const supabase = await getAuthenticatedSupabase();
    await saveMarketingScheduleRowsRecord(supabase, rows);
    revalidateApp([PUBLIC_CACHE_TAGS.marketing]);
    revalidatePath("/dashboard/marketing/horarios");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar los horarios.";
    return { success: false, error: message };
  }
}

export async function saveMarketingTeamMembers(members: MarketingContentValues["teamMembers"]): Promise<ActionResponse> {
  try {
    await requireAdminUser();
    const supabase = await getAuthenticatedSupabase();
    await saveMarketingTeamMembersRecord(supabase, members);
    revalidateApp([PUBLIC_CACHE_TAGS.marketing]);
    revalidatePath("/dashboard/marketing/equipo");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar el equipo.";
    return { success: false, error: message };
  }
}

export async function saveTrainingZone(values: TrainingZoneValues): Promise<ActionResponse> {
  try {
    await requireAdminUser();
    const parsed = trainingZoneSchema.parse(values);
    const supabase = await getAuthenticatedSupabase();

    await updateTrainingZoneRecord(supabase, parsed);
    revalidateApp([PUBLIC_CACHE_TAGS.marketing]);
    revalidatePath("/dashboard/marketing/zonas");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar la zona.";
    return { success: false, error: message };
  }
}

export async function updateLeadStatus(id: string, status: "new" | "contacted" | "closed") {
  await requireAdminUser();
  const parsed = leadStatusSchema.parse({ status });
  const supabase = await getAuthenticatedSupabase();
  await updateLeadStatusRecord(supabase, id, parsed.status);
  revalidatePath("/dashboard/leads");
}

export async function saveLeadFollowUp(id: string, values: LeadFollowUpValues) {
  await requireAdminUser();
  const parsed = leadFollowUpSchema.parse(values);
  const supabase = await getAuthenticatedSupabase();
  await updateLeadFollowUpRecord(supabase, id, parsed);
  revalidatePath("/dashboard/leads");
}

export async function saveCmsDocument(values: CmsDocumentValues) {
  await requireAdminUser();
  const parsed = cmsDocumentSchema.parse(values);
  const supabase = await getAuthenticatedSupabase();
  await saveCmsDocumentRecord(supabase, parsed);
  revalidateApp([PUBLIC_CACHE_TAGS.cms]);
  revalidatePath("/dashboard/cms");
}

export async function moderateMarketingTestimonial(
  id: string,
  moderationStatus: Extract<MarketingTestimonialModerationStatus, "approved" | "rejected">,
) {
  await requireAdminUser();
  const parsed = moderateMarketingTestimonialSchema.parse({
    id,
    moderationStatus,
  });
  const supabase = await getAuthenticatedSupabase();

  if (parsed.moderationStatus === "pending") {
    throw new Error("La moderacion manual solo permite aprobar o rechazar la resena.");
  }

  await moderateMarketingTestimonialRecord(supabase, parsed.id, parsed.moderationStatus);
  revalidateApp([PUBLIC_CACHE_TAGS.marketing]);
  revalidatePath("/dashboard/marketing/testimonios");
}

export async function deleteLeadAction(id: string) {
  await requireAdminUser();
  const supabase = await getAuthenticatedSupabase();
  await deleteLeadRecord(supabase, id);
  revalidatePath("/dashboard/leads");
}

export async function updateBrandingAction(values: BrandingValues): Promise<ActionResponse> {
  try {
    await requireAdminUser();
    const parsed = brandingSchema.parse(values);
    const supabase = await getAuthenticatedSupabase();

    await updateBrandingRecord(supabase, {
      gym_name: parsed.gym_name,
      slogan: parsed.slogan,
      primary_color: parsed.primary_color,
      secondary_color: parsed.secondary_color,
      logo_url: parsed.logo_url,
      favicon_url: parsed.favicon_url,
    });

    revalidateApp([PUBLIC_CACHE_TAGS.marketing]);
    revalidatePath("/dashboard/web/branding");
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error al actualizar branding." 
    };
  }
}

export async function updateThemeAction(config: ThemeConfig): Promise<ActionResponse> {
  try {
    await requireAdminUser();
    const parsed = themeConfigSchema.parse(config);
    const supabase = await getAuthenticatedSupabase();

    await updateThemeConfigRecord(supabase, parsed);

    revalidateApp([PUBLIC_CACHE_TAGS.marketing]);
    revalidatePath("/dashboard/web/tema");
    return { success: true };
  } catch (error) {
    console.error("DEBUG: updateThemeAction Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar la configuracion del tema."
    };
  }
}


