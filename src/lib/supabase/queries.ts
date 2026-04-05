import { cache } from "react";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import {
  cmsDocumentKeys,
  getDefaultCmsDocument,
  defaultCmsDocumentList,
  type CmsDocumentKey,
} from "@/lib/data/default-cms";
import { defaultSiteSettings } from "@/lib/data/default-content";
import {
  defaultMarketingPlans,
  defaultMarketingScheduleRows,
  defaultMarketingTestimonials,
  type MarketingPlan,
  type MarketingScheduleRow,
  type MarketingTestimonial,
  type MarketingTestimonialModerationStatus,
} from "@/lib/data/marketing-content";
import { hasSupabasePublicEnv, hasSupabaseServiceRole } from "@/lib/env";
import { parseSeoKeywordsInput } from "@/lib/seo";
import { resolveTopbarVariant, toIsoDateTimeOrNull } from "@/lib/topbar";
import type { ContactFormValues } from "@/lib/validators/contact";
import type { CmsDocumentValues } from "@/lib/validators/cms-document";
import type { LeadFollowUpValues } from "@/lib/validators/lead";
import type { MarketingContentValues } from "@/lib/validators/marketing";
import type { SiteSettingsValues } from "@/lib/validators/settings";
import { trimToNull } from "@/lib/utils";

import type {
  Database,
  DBCmsDocument,
  DBMarketingPlan,
  DBMarketingScheduleRow,
  DBMarketingTestimonial,
  Json,
  Lead,
  LeadStatus,
  SiteSettings,
} from "./database.types";
import {
  createSupabaseAdminClient,
  createSupabasePublicClient,
} from "./server";

type GymSupabaseClient = SupabaseClient<Database>;

const SETTINGS_ID = 1;
const leadStatuses: LeadStatus[] = ["new", "contacted", "closed"];

export interface MarketingSnapshot {
  settings: SiteSettings;
  plans: MarketingPlan[];
  scheduleRows: MarketingScheduleRow[];
  testimonials: MarketingTestimonial[];
  isFallback: boolean;
  warning: string | null;
}

export interface DashboardSnapshot extends MarketingSnapshot {
  leads: Lead[];
}

export type DashboardMarketingSnapshot = MarketingSnapshot;

export interface CmsSnapshot {
  documents: DBCmsDocument[];
  byKey: Record<CmsDocumentKey, DBCmsDocument>;
  isFallback: boolean;
  warning: string | null;
}

function isCmsDocumentKey(value: string | null | undefined): value is CmsDocumentKey {
  return cmsDocumentKeys.includes(value as CmsDocumentKey);
}

function safeString(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function safeStringArray(value: string[] | null | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => item.trim()).filter(Boolean);
}

export function normalizeMarketingPlan(
  row: Partial<DBMarketingPlan> | null | undefined,
  index = 0,
): MarketingPlan {
  const fallback = defaultMarketingPlans[index] ?? defaultMarketingPlans[0];

  return {
    ...fallback,
    ...row,
    id: row?.id ?? fallback.id,
    site_settings_id: row?.site_settings_id ?? fallback.site_settings_id,
    title: safeString(row?.title, fallback.title),
    description: trimToNull(row?.description) ?? fallback.description,
    price_label: safeString(row?.price_label, fallback.price_label),
    billing_label: safeString(row?.billing_label, fallback.billing_label),
    badge: trimToNull(row?.badge) ?? fallback.badge,
    features: Array.isArray(row?.features)
      ? row.features
      : (typeof row?.features === "string" ? JSON.parse(row.features) : fallback.features),
    is_featured: row?.is_featured ?? fallback.is_featured,
    order: row?.order ?? fallback.order,
    is_active: row?.is_active ?? fallback.is_active,
    created_at: row?.created_at ?? fallback.created_at,
    updated_at: row?.updated_at ?? fallback.updated_at,
  };
}

export function normalizeMarketingPlans(
  rows: Partial<DBMarketingPlan>[] | null | undefined,
): MarketingPlan[] {
  if (!rows?.length) {
    return defaultMarketingPlans.map((plan) => ({ ...plan, features: [...plan.features] }));
  }

  return rows
    .map((row, index) => normalizeMarketingPlan(row, index))
    .sort((left, right) => left.order - right.order);
}

export function normalizeMarketingScheduleRow(
  row: Partial<DBMarketingScheduleRow> | null | undefined,
  index = 0,
): MarketingScheduleRow {
  const fallback = defaultMarketingScheduleRows[index] ?? defaultMarketingScheduleRows[0];

  return {
    ...fallback,
    ...row,
    id: row?.id ?? fallback.id,
    site_settings_id: row?.site_settings_id ?? fallback.site_settings_id,
    label: safeString(row?.label, fallback.label),
    description: trimToNull(row?.description) ?? fallback.description,
    opens_at: safeString(row?.opens_at, fallback.opens_at),
    closes_at: safeString(row?.closes_at, fallback.closes_at),
    order: row?.order ?? fallback.order,
    is_active: row?.is_active ?? fallback.is_active,
    created_at: row?.created_at ?? fallback.created_at,
    updated_at: row?.updated_at ?? fallback.updated_at,
  };
}

export function normalizeMarketingScheduleRows(
  rows: Partial<DBMarketingScheduleRow>[] | null | undefined,
): MarketingScheduleRow[] {
  if (!rows?.length) {
    return defaultMarketingScheduleRows.map((row) => ({ ...row }));
  }

  return rows
    .map((row, index) => normalizeMarketingScheduleRow(row, index))
    .sort((left, right) => left.order - right.order);
}

export function normalizeMarketingTestimonial(
  row: Partial<DBMarketingTestimonial> | null | undefined,
): MarketingTestimonial | null {
  if (!row?.id || !row.member_profile_id || !row.supabase_user_id) {
    return null;
  }

  const moderationStatus = row.moderation_status;
  const normalizedStatus: MarketingTestimonialModerationStatus =
    moderationStatus === "approved" || moderationStatus === "rejected" || moderationStatus === "pending"
      ? moderationStatus
      : "pending";

  const normalizedQuote = trimToNull(row.quote);
  const normalizedName = trimToNull(row.author_name);
  const normalizedDetail = trimToNull(row.author_detail);
  const normalizedInitials = trimToNull(row.author_initials);

  if (!normalizedQuote || !normalizedName || !normalizedDetail || !normalizedInitials) {
    return null;
  }

  const rating = typeof row.rating === "number" && Number.isInteger(row.rating) ? row.rating : null;

  if (!rating || rating < 1 || rating > 5) {
    return null;
  }

  return {
    id: row.id,
    site_settings_id: row.site_settings_id ?? SETTINGS_ID,
    member_profile_id: row.member_profile_id,
    supabase_user_id: row.supabase_user_id,
    quote: normalizedQuote,
    rating,
    author_name: normalizedName,
    author_detail: normalizedDetail,
    author_initials: normalizedInitials,
    moderation_status: normalizedStatus,
    approved_at: trimToNull(row.approved_at),
    created_at: row.created_at ?? new Date(0).toISOString(),
    updated_at: row.updated_at ?? new Date(0).toISOString(),
  };
}

export function normalizeMarketingTestimonials(
  rows: Partial<DBMarketingTestimonial>[] | null | undefined,
): MarketingTestimonial[] {
  if (!rows?.length) {
    return defaultMarketingTestimonials.map((testimonial) => ({ ...testimonial }));
  }

  return rows
    .map((row) => normalizeMarketingTestimonial(row))
    .filter((testimonial): testimonial is MarketingTestimonial => Boolean(testimonial));
}

export function normalizeCmsDocument(
  row: Partial<DBCmsDocument> | null | undefined,
  fallbackKey: CmsDocumentKey = "system-error-generic",
): DBCmsDocument {
  const key = isCmsDocumentKey(row?.key) ? row.key : fallbackKey;
  const fallback = getDefaultCmsDocument(key);

  return {
    ...fallback,
    ...row,
    key,
    kind: row?.kind === "system" || row?.kind === "legal" ? row.kind : fallback.kind,
    slug: safeString(row?.slug, fallback.slug),
    title: safeString(row?.title, fallback.title),
    summary: trimToNull(row?.summary) ?? fallback.summary,
    body_markdown: trimToNull(row?.body_markdown) ?? fallback.body_markdown,
    cta_label: trimToNull(row?.cta_label) ?? fallback.cta_label,
    cta_href: trimToNull(row?.cta_href) ?? fallback.cta_href,
    seo_title: safeString(row?.seo_title, fallback.seo_title),
    seo_description: safeString(row?.seo_description, fallback.seo_description),
    is_published: row?.is_published ?? fallback.is_published,
    updated_at: row?.updated_at ?? fallback.updated_at,
  };
}

export function normalizeCmsDocuments(rows: Partial<DBCmsDocument>[] | null | undefined) {
  const byKey = {} as Record<CmsDocumentKey, DBCmsDocument>;

  for (const key of cmsDocumentKeys) {
    byKey[key] = getDefaultCmsDocument(key);
  }

  for (const row of rows ?? []) {
    if (!isCmsDocumentKey(row.key)) {
      continue;
    }

    byKey[row.key] = normalizeCmsDocument(row, row.key);
  }

  return cmsDocumentKeys.map((key) => byKey[key]);
}

export function normalizeSiteSettings(row: Partial<SiteSettings> | null | undefined): SiteSettings {
  const normalizedKeywords = safeStringArray(row?.seo_keywords);

  return {
    ...defaultSiteSettings,
    ...row,
    site_name: safeString(row?.site_name, defaultSiteSettings.site_name),
    site_tagline: safeString(row?.site_tagline, defaultSiteSettings.site_tagline),
    hero_badge: safeString(row?.hero_badge, defaultSiteSettings.hero_badge),
    hero_title: safeString(row?.hero_title, defaultSiteSettings.hero_title),
    hero_description: safeString(row?.hero_description, defaultSiteSettings.hero_description),
    hero_primary_cta: safeString(row?.hero_primary_cta, defaultSiteSettings.hero_primary_cta),
    hero_secondary_cta: safeString(row?.hero_secondary_cta, defaultSiteSettings.hero_secondary_cta),
    hero_video_url: trimToNull(row?.hero_video_url) ?? defaultSiteSettings.hero_video_url,
    topbar_enabled: row?.topbar_enabled ?? defaultSiteSettings.topbar_enabled,
    topbar_variant: resolveTopbarVariant(row?.topbar_variant),
    topbar_text: trimToNull(row?.topbar_text) ?? defaultSiteSettings.topbar_text,
    topbar_cta_label: trimToNull(row?.topbar_cta_label) ?? defaultSiteSettings.topbar_cta_label,
    topbar_cta_url: trimToNull(row?.topbar_cta_url) ?? defaultSiteSettings.topbar_cta_url,
    topbar_expires_at:
      trimToNull(row?.topbar_expires_at) ?? defaultSiteSettings.topbar_expires_at,
    hero_highlight_one: safeString(row?.hero_highlight_one, defaultSiteSettings.hero_highlight_one),
    hero_highlight_two: safeString(row?.hero_highlight_two, defaultSiteSettings.hero_highlight_two),
    hero_highlight_three: safeString(
      row?.hero_highlight_three,
      defaultSiteSettings.hero_highlight_three,
    ),
    contact_email: safeString(row?.contact_email, defaultSiteSettings.contact_email),
    notification_email: safeString(
      row?.notification_email,
      defaultSiteSettings.notification_email,
    ),
    transactional_from_email: safeString(
      row?.transactional_from_email,
      defaultSiteSettings.transactional_from_email,
    ),
    contact_phone: trimToNull(row?.contact_phone) ?? defaultSiteSettings.contact_phone,
    whatsapp_url: trimToNull(row?.whatsapp_url) ?? defaultSiteSettings.whatsapp_url,
    address: trimToNull(row?.address) ?? defaultSiteSettings.address,
    opening_hours: trimToNull(row?.opening_hours) ?? defaultSiteSettings.opening_hours,
    seo_title: safeString(row?.seo_title, defaultSiteSettings.seo_title),
    seo_description: safeString(row?.seo_description, defaultSiteSettings.seo_description),
    seo_keywords: normalizedKeywords.length ? normalizedKeywords : defaultSiteSettings.seo_keywords,
    seo_og_image_url: trimToNull(row?.seo_og_image_url) ?? defaultSiteSettings.seo_og_image_url,
    seo_canonical_url:
      trimToNull(row?.seo_canonical_url) ?? defaultSiteSettings.seo_canonical_url,
    footer_text: safeString(row?.footer_text, defaultSiteSettings.footer_text),
    updated_at: row?.updated_at ?? defaultSiteSettings.updated_at,
  };
}

export function normalizeLeads(rows: Partial<Lead>[] | null | undefined): Lead[] {
  return (rows ?? [])
    .reduce<Lead[]>((leads, row, index) => {
      if (!row.id) {
        return leads;
      }

      const status = leadStatuses.includes(row.status as LeadStatus)
        ? (row.status as LeadStatus)
        : "new";

      leads.push({
        channel: trimToNull(row.channel),
        contacted_at: trimToNull(row.contacted_at),
        id: row.id,
        name: safeString(row.name, `Lead ${index + 1}`),
        email: safeString(row.email, "sin-email@invalid.local"),
        phone: trimToNull(row.phone),
        message: safeString(row.message, "Lead sin mensaje."),
        source: safeString(row.source, "website"),
        status,
        metadata: (row.metadata as Json) ?? {},
        created_at: row.created_at ?? new Date(0).toISOString(),
        next_step: trimToNull(row.next_step),
        outcome: trimToNull(row.outcome),
      });

      return leads;
    }, [])
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}
export function normalizeLead(row: Partial<Lead> | null | undefined): Lead {
  const status = (row && leadStatuses.includes(row.status as LeadStatus))
    ? (row.status as LeadStatus)
    : "new";

  return {
    channel: trimToNull(row?.channel),
    contacted_at: trimToNull(row?.contacted_at),
    id: row?.id || "unknown",
    name: safeString(row?.name, "Nombre no disponible"),
    email: safeString(row?.email, "sin-email@invalid.local"),
    phone: trimToNull(row?.phone),
    message: safeString(row?.message, "Lead sin mensaje."),
    source: safeString(row?.source, "website"),
    status,
    metadata: (row?.metadata as Json) ?? {},
    created_at: row?.created_at ?? new Date(0).toISOString(),
    next_step: trimToNull(row?.next_step),
    outcome: trimToNull(row?.outcome),
  };
}

export function buildLeadInsertPayload(
  values: ContactFormValues,
): Database["public"]["Tables"]["leads"]["Insert"] {
  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: trimToNull(values.phone),
    message: values.message.trim(),
    source: "website",
    status: "new",
    metadata: {},
  };
}

export function buildLeadFollowUpPayload(
  values: LeadFollowUpValues,
): Database["public"]["Tables"]["leads"]["Update"] {
  return {
    contacted_at: toIsoDateTimeOrNull(values.contacted_at),
    channel: trimToNull(values.channel),
    outcome: trimToNull(values.outcome),
    next_step: trimToNull(values.next_step),
  };
}

export function buildSiteSettingsPayload(
  values: SiteSettingsValues,
): Database["public"]["Tables"]["site_settings"]["Insert"] {
  return {
    id: SETTINGS_ID,
    site_name: values.site_name.trim(),
    site_tagline: values.site_tagline.trim(),
    hero_badge: values.hero_badge.trim(),
    hero_title: values.hero_title.trim(),
    hero_description: values.hero_description.trim(),
    hero_primary_cta: values.hero_primary_cta.trim(),
    hero_secondary_cta: values.hero_secondary_cta.trim(),
    hero_video_url: trimToNull(values.hero_video_url),
    topbar_enabled: values.topbar_enabled,
    topbar_variant: values.topbar_variant,
    topbar_text: trimToNull(values.topbar_text),
    topbar_cta_label: trimToNull(values.topbar_cta_label),
    topbar_cta_url: trimToNull(values.topbar_cta_url),
    topbar_expires_at: toIsoDateTimeOrNull(values.topbar_expires_at),
    hero_highlight_one: values.hero_highlight_one.trim(),
    hero_highlight_two: values.hero_highlight_two.trim(),
    hero_highlight_three: values.hero_highlight_three.trim(),
    contact_email: values.contact_email.trim().toLowerCase(),
    notification_email: values.notification_email.trim().toLowerCase(),
    transactional_from_email: values.transactional_from_email.trim().toLowerCase(),
    contact_phone: trimToNull(values.contact_phone),
    whatsapp_url: trimToNull(values.whatsapp_url),
    address: trimToNull(values.address),
    opening_hours: trimToNull(values.opening_hours),
    seo_title: values.seo_title.trim(),
    seo_description: values.seo_description.trim(),
    seo_keywords: parseSeoKeywordsInput(values.seo_keywords),
    seo_og_image_url: trimToNull(values.seo_og_image_url),
    seo_canonical_url: trimToNull(values.seo_canonical_url),
    footer_text: values.footer_text.trim(),
    updated_at: new Date().toISOString(),
  };
}

export function buildCmsDocumentPayload(
  values: CmsDocumentValues,
): Database["public"]["Tables"]["cms_documents"]["Insert"] {
  return {
    key: values.key,
    kind: values.kind,
    slug: values.slug.trim(),
    title: values.title.trim(),
    summary: values.summary.trim(),
    body_markdown: values.body_markdown.trim(),
    cta_label: trimToNull(values.cta_label),
    cta_href: trimToNull(values.cta_href),
    seo_title: values.seo_title.trim(),
    seo_description: values.seo_description.trim(),
    is_published: values.is_published,
    updated_at: new Date().toISOString(),
  };
}

function buildMarketingPlanPayload(
  values: MarketingContentValues["plans"][number],
): Database["public"]["Tables"]["marketing_plans"]["Insert"] {
  return {
    id: values.id,
    site_settings_id: SETTINGS_ID,
    title: values.title.trim(),
    description: trimToNull(values.description),
    price_label: values.price_label.trim(),
    billing_label: values.billing_label.trim(),
    badge: trimToNull(values.badge),
    features: values.features.map((feature) => ({
      label: feature.label.trim(),
      included: feature.included,
    })),
    is_featured: values.is_featured,
    order: values.order,
    is_active: values.is_active,
    updated_at: new Date().toISOString(),
  };
}

function buildMarketingScheduleRowPayload(
  values: MarketingContentValues["scheduleRows"][number],
): Database["public"]["Tables"]["marketing_schedule_rows"]["Insert"] {
  return {
    id: values.id,
    site_settings_id: SETTINGS_ID,
    label: values.label.trim(),
    description: trimToNull(values.description),
    opens_at: values.opens_at.trim(),
    closes_at: values.closes_at.trim(),
    order: values.order,
    is_active: values.is_active,
    updated_at: new Date().toISOString(),
  };
}

function mapSupabaseError(error: PostgrestError | Error | null | undefined, entityName: string) {
  const errorRecord = error as { message?: string } | null | undefined;
  const message = error instanceof Error ? error.message : errorRecord?.message;
  return message ?? `No se pudo guardar ${entityName}.`;
}

export const getMarketingSnapshot = cache(async (): Promise<MarketingSnapshot> => {
  if (!hasSupabasePublicEnv()) {
    return {
      settings: defaultSiteSettings,
      plans: defaultMarketingPlans,
      scheduleRows: defaultMarketingScheduleRows,
      testimonials: defaultMarketingTestimonials,
      isFallback: true,
      warning: "Supabase no esta configurado. Se muestran datos fallback.",
    };
  }

  try {
    const supabase = createSupabasePublicClient();
    
    // Fetch settings first to see which site we are on, but don't force ID 1
    const { data: settings, error: settingsError } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching site_settings in getMarketingSnapshot:", settingsError);
    }

    const actualSettingsId = settings?.id;

    const [ { data: plans, error: plansError }, { data: scheduleRows, error: scheduleError }, { data: testimonials, error: testimonialsError } ] =
      await Promise.all([
      // If we have a settings ID, use it. If not, fetch all (as per flexibility requirement)
      actualSettingsId 
        ? supabase.from("marketing_plans").select("*").eq("site_settings_id", actualSettingsId)
        : supabase.from("marketing_plans").select("*"),
      actualSettingsId
        ? supabase.from("marketing_schedule_rows").select("*").eq("site_settings_id", actualSettingsId)
        : supabase.from("marketing_schedule_rows").select("*"),
      actualSettingsId
        ? supabase
            .from("marketing_testimonials")
            .select("*")
            .eq("site_settings_id", actualSettingsId)
            .eq("moderation_status", "approved")
            .order("approved_at", { ascending: false })
            .order("updated_at", { ascending: false })
            .limit(3)
        : supabase
            .from("marketing_testimonials")
            .select("*")
            .eq("moderation_status", "approved")
            .order("approved_at", { ascending: false })
            .order("updated_at", { ascending: false })
            .limit(3),
      ]);

    if (plansError) console.error("Error fetching marketing_plans:", plansError);
    if (scheduleError) console.error("Error fetching marketing_schedule_rows:", scheduleError);
    if (testimonialsError) console.error("Error fetching marketing_testimonials:", testimonialsError);

    const normalizedPlans = normalizeMarketingPlans(plans).filter((plan) => plan.is_active);

    return {
      settings: normalizeSiteSettings(settings),
      plans: normalizedPlans,
      scheduleRows: normalizeMarketingScheduleRows(scheduleRows).filter((row) => row.is_active),
      testimonials: normalizeMarketingTestimonials(testimonials),
      isFallback: false,
      warning: null,
    };
  } catch (error) {
    console.error("Excepcion capturada en getMarketingSnapshot:", error);
    return {
      settings: defaultSiteSettings,
      plans: defaultMarketingPlans,
      scheduleRows: defaultMarketingScheduleRows,
      testimonials: defaultMarketingTestimonials,
      isFallback: true,
      warning: "No se pudieron cargar los datos reales de Supabase. Se muestra contenido fallback.",
    };
  }
});

export async function getDashboardMarketingSnapshot(): Promise<DashboardMarketingSnapshot> {
  if (!hasSupabasePublicEnv()) {
    return {
      settings: defaultSiteSettings,
      plans: defaultMarketingPlans,
      scheduleRows: defaultMarketingScheduleRows,
      testimonials: defaultMarketingTestimonials,
      isFallback: true,
      warning: "Supabase no esta configurado. Marketing usa contenido fallback.",
    };
  }

  try {
    const publicSupabase = createSupabasePublicClient();
    
    // Fetch settings first to see which site we are on, but don't force ID 1
    const { data: settings } = await publicSupabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    const actualSettingsId = settings?.id;

    const [{ data: plans }, { data: scheduleRows }] = await Promise.all([
      actualSettingsId
        ? publicSupabase.from("marketing_plans").select("*").eq("site_settings_id", actualSettingsId)
        : publicSupabase.from("marketing_plans").select("*"),
      actualSettingsId
        ? publicSupabase
            .from("marketing_schedule_rows")
            .select("*")
            .eq("site_settings_id", actualSettingsId)
        : publicSupabase.from("marketing_schedule_rows").select("*"),
    ]);

    let testimonials: MarketingTestimonial[] = [];

    if (hasSupabaseServiceRole()) {
      const adminSupabase = createSupabaseAdminClient();
      // For dashboard, we might want to list all testimonials or filter by actualSettingsId
      testimonials = await listMarketingTestimonialsRecord(adminSupabase, {
        moderationStatuses: ["pending", "approved", "rejected"],
        siteSettingsId: actualSettingsId,
      });
    }

    return {
      settings: normalizeSiteSettings(settings),
      plans: normalizeMarketingPlans(plans),
      scheduleRows: normalizeMarketingScheduleRows(scheduleRows),
      testimonials,
      isFallback: false,
      warning: null,
    };
  } catch (error) {
    console.error("Error en getDashboardMarketingSnapshot:", error);
    return {
      settings: defaultSiteSettings,
      plans: defaultMarketingPlans,
      scheduleRows: defaultMarketingScheduleRows,
      testimonials: defaultMarketingTestimonials,
      isFallback: true,
      warning: "No se pudo cargar el marketing real. Se muestra contenido fallback.",
    };
  }
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeLead(data);
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!hasSupabasePublicEnv()) {
    return {
      settings: defaultSiteSettings,
      plans: defaultMarketingPlans,
      scheduleRows: defaultMarketingScheduleRows,
      testimonials: defaultMarketingTestimonials,
      leads: [],
      isFallback: true,
      warning: "Supabase no esta configurado. El dashboard usa contenido fallback.",
    };
  }

  const publicSupabase = createSupabasePublicClient();

  const [
    { data: settings, error: settingsError },
    { data: plans, error: plansError },
    { data: scheduleRows, error: scheduleRowsError },
    { data: testimonials, error: testimonialsError },
  ] = await Promise.all([
    publicSupabase.from("site_settings").select("*").limit(1).maybeSingle(),
    publicSupabase.from("marketing_plans").select("*"), // Fetch all for dashboard flexibility
    publicSupabase.from("marketing_schedule_rows").select("*"),
    publicSupabase
      .from("marketing_testimonials")
      .select("*")
      .eq("moderation_status", "approved")
      .order("approved_at", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(3),
  ]);

  const warnings: string[] = [];

  if (settingsError) {
    warnings.push("No se pudieron cargar los ajustes reales del sitio. Se muestran valores fallback.");
  }

  if (plansError || scheduleRowsError) {
    warnings.push("No se pudo cargar parte del contenido comercial editable.");
  }

  if (testimonialsError) {
    warnings.push("No se pudieron cargar las reseñas aprobadas de marketing.");
  }

  if (!hasSupabaseServiceRole()) {
    warnings.push(
      "Configura SUPABASE_SERVICE_ROLE_KEY para leer contactos reales y operar el dashboard interno.",
    );
  }

  if (!hasSupabaseServiceRole()) {
    return {
      settings: settingsError ? defaultSiteSettings : normalizeSiteSettings(settings),
      plans: plansError ? defaultMarketingPlans : normalizeMarketingPlans(plans),
      scheduleRows: scheduleRowsError
        ? defaultMarketingScheduleRows
        : normalizeMarketingScheduleRows(scheduleRows),
      testimonials: testimonialsError
        ? defaultMarketingTestimonials
        : normalizeMarketingTestimonials(testimonials),
      leads: [],
      isFallback: true,
      warning: warnings.join(" "),
    };
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: leads, error: leadsError } = await adminSupabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (leadsError) {
    warnings.push("No se pudieron cargar los leads reales del dashboard.");
  }

  return {
    settings: settingsError ? defaultSiteSettings : normalizeSiteSettings(settings),
    plans: plansError ? defaultMarketingPlans : normalizeMarketingPlans(plans),
    scheduleRows: scheduleRowsError
      ? defaultMarketingScheduleRows
      : normalizeMarketingScheduleRows(scheduleRows),
    testimonials: testimonialsError
      ? defaultMarketingTestimonials
      : normalizeMarketingTestimonials(testimonials),
    leads: leadsError ? [] : normalizeLeads(leads),
    isFallback: warnings.length > 0,
    warning: warnings.length > 0 ? warnings.join(" ") : null,
  };
}

export async function listMarketingTestimonialsRecord(
  supabase: GymSupabaseClient,
  options?: {
    limit?: number;
    moderationStatuses?: MarketingTestimonialModerationStatus[];
    userId?: string;
    siteSettingsId?: string | number;
  },
) {
  let query = supabase.from("marketing_testimonials").select("*");

  // Use the provided ID, or the default check if it's meant to be site-specific
  if (options?.siteSettingsId !== undefined && options.siteSettingsId !== null) {
    const siteSettingsId =
      typeof options.siteSettingsId === "string"
        ? Number(options.siteSettingsId)
        : options.siteSettingsId;

    query = query.eq("site_settings_id", siteSettingsId);
  }

  query = query
    .order("approved_at", { ascending: false })
    .order("updated_at", { ascending: false });

  if (options?.moderationStatuses?.length === 1) {
    query = query.eq("moderation_status", options.moderationStatuses[0]);
  } else if (options?.moderationStatuses?.length) {
    query = query.in("moderation_status", options.moderationStatuses);
  }

  if (options?.userId) {
    query = query.eq("supabase_user_id", options.userId);
  }

  if (typeof options?.limit === "number") {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(mapSupabaseError(error, "las resenas"));
  }

  return normalizeMarketingTestimonials(data);
}

export async function getMemberMarketingTestimonialRecord(
  supabase: GymSupabaseClient,
  userId: string,
) {
  // Try to get the settings id if not forced
  const { data: settings } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
  const actualSettingsId = settings?.id;

  let query = supabase.from("marketing_testimonials").select("*").eq("supabase_user_id", userId);

  if (actualSettingsId) {
    query = query.eq("site_settings_id", actualSettingsId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(mapSupabaseError(error, "tu resena"));
  }

  return normalizeMarketingTestimonial(data);
}

export async function upsertMemberMarketingTestimonialRecord(
  supabase: GymSupabaseClient,
  values: Database["public"]["Tables"]["marketing_testimonials"]["Insert"],
) {
  // Ensure we use a valid site_settings_id
  const { data: settings } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
  const actualSettingsId = settings?.id ?? SETTINGS_ID;

  const payload: Database["public"]["Tables"]["marketing_testimonials"]["Insert"] = {
    ...values,
    site_settings_id: actualSettingsId,
    approved_at: null,
    moderation_status: "pending",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("marketing_testimonials")
    .upsert(payload, { onConflict: "supabase_user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(mapSupabaseError(error, "tu resena"));
  }

  const normalized = normalizeMarketingTestimonial(data);

  if (!normalized) {
    throw new Error("La resena guardada quedo en un estado invalido.");
  }

  return normalized;
}

export async function moderateMarketingTestimonialRecord(
  supabase: GymSupabaseClient,
  id: string,
  moderationStatus: Extract<MarketingTestimonialModerationStatus, "approved" | "rejected">,
) {
  const { data, error } = await supabase
    .from("marketing_testimonials")
    .update({
      approved_at: moderationStatus === "approved" ? new Date().toISOString() : null,
      moderation_status: moderationStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(mapSupabaseError(error, "la resena"));
  }

  if (!data) {
    throw new Error("La resena que intentas moderar ya no existe.");
  }

  const normalized = normalizeMarketingTestimonial(data);

  if (!normalized) {
    throw new Error("La resena moderada quedo en un estado invalido.");
  }

  return normalized;
}

function toCmsSnapshot(
  documents: DBCmsDocument[],
  options?: { isFallback?: boolean; warning?: string | null },
): CmsSnapshot {
  const byKey = {} as Record<CmsDocumentKey, DBCmsDocument>;

  for (const document of documents) {
    byKey[document.key as CmsDocumentKey] = document;
  }

  return {
    documents,
    byKey,
    isFallback: options?.isFallback ?? false,
    warning: options?.warning ?? null,
  };
}

export const getPublicCmsSnapshot = cache(async (): Promise<CmsSnapshot> => {
  const fallbackDocuments = defaultCmsDocumentList.map((document) => ({ ...document }));

  if (!hasSupabasePublicEnv()) {
    return toCmsSnapshot(fallbackDocuments, {
      isFallback: true,
      warning: "Supabase no esta configurado. Se muestra contenido legal fallback.",
    });
  }

  try {
    const supabase = createSupabasePublicClient();
    const { data } = await supabase
      .from("cms_documents")
      .select("*")
      .eq("is_published", true)
      .order("key", { ascending: true });

    return toCmsSnapshot(normalizeCmsDocuments(data), {
      isFallback: false,
      warning: null,
    });
  } catch {
    return toCmsSnapshot(fallbackDocuments, {
      isFallback: true,
      warning: "No se pudo cargar el CMS legal. Se muestran textos fallback.",
    });
  }
});

export async function getDashboardCmsSnapshot(): Promise<CmsSnapshot> {
  const fallbackDocuments = defaultCmsDocumentList.map((document) => ({ ...document }));

  if (!hasSupabasePublicEnv()) {
    return toCmsSnapshot(fallbackDocuments, {
      isFallback: true,
      warning: "Supabase no esta configurado. El CMS usa contenido fallback.",
    });
  }

  if (!hasSupabaseServiceRole()) {
    return toCmsSnapshot(fallbackDocuments, {
      isFallback: true,
      warning: "Configura SUPABASE_SERVICE_ROLE_KEY para editar contenido legal y de sistema.",
    });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("cms_documents")
      .select("*")
      .order("key", { ascending: true });

    if (error) {
      return toCmsSnapshot(fallbackDocuments, {
        isFallback: true,
        warning: "No se pudo cargar el CMS real. Se muestran textos fallback.",
      });
    }

    return toCmsSnapshot(normalizeCmsDocuments(data), {
      isFallback: false,
      warning: null,
    });
  } catch {
    return toCmsSnapshot(fallbackDocuments, {
      isFallback: true,
      warning: "No se pudo cargar el CMS real. Se muestran textos fallback.",
    });
  }
}

export async function createLeadRecord(supabase: GymSupabaseClient, values: ContactFormValues) {
  const payload = buildLeadInsertPayload(values);
  const { error } = await supabase.from("leads").insert(payload);

  if (error) {
    throw new Error(mapSupabaseError(error, "el lead"));
  }
}

export async function saveSiteSettingsRecord(
  supabase: GymSupabaseClient,
  values: SiteSettingsValues,
) {
  const payload = buildSiteSettingsPayload(values);
  const { error } = await supabase.from("site_settings").upsert(payload);

  if (error) {
    throw new Error(mapSupabaseError(error, "los ajustes"));
  }
}

export async function getMarketingPlansRecord(
  supabase: GymSupabaseClient,
  options?: { includeInactive?: boolean },
) {
  // Attempt to get the site settings id to filter correctly if possible
  const { data: settings } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
  const actualSettingsId = settings?.id;

  let query = supabase.from("marketing_plans").select("*").order("order", { ascending: true });

  if (actualSettingsId) {
    query = query.eq("site_settings_id", actualSettingsId);
  }

  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(mapSupabaseError(error, "los planes"));
  }

  return normalizeMarketingPlans(data);
}

export async function getMarketingScheduleRowsRecord(
  supabase: GymSupabaseClient,
  options?: { includeInactive?: boolean },
) {
  // Attempt to get the site settings id to filter correctly if possible
  const { data: settings } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
  const actualSettingsId = settings?.id;

  let query = supabase.from("marketing_schedule_rows").select("*").order("order", { ascending: true });

  if (actualSettingsId) {
    query = query.eq("site_settings_id", actualSettingsId);
  }

  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(mapSupabaseError(error, "los horarios"));
  }

  return normalizeMarketingScheduleRows(data);
}

type MarketingPlanInsert = Database["public"]["Tables"]["marketing_plans"]["Insert"];
type MarketingScheduleRowInsert =
  Database["public"]["Tables"]["marketing_schedule_rows"]["Insert"];

async function replaceMarketingTableRows(
  supabase: GymSupabaseClient,
  table: "marketing_plans" | "marketing_schedule_rows",
  payloads: MarketingPlanInsert[] | MarketingScheduleRowInsert[],
) {
  const { data: existingRows, error: existingError } = await supabase
    .from(table)
    .select("id")
    .eq("site_settings_id", SETTINGS_ID);

  if (existingError) {
    throw new Error(mapSupabaseError(existingError, "el contenido de marketing"));
  }

  const keepIds = new Set(
    payloads
      .map((item) => item.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );
  const idsToDelete = (existingRows ?? [])
    .map((row) => row.id)
    .filter((id) => !keepIds.has(id));

  if (payloads.length > 0) {
    const { error } =
      table === "marketing_plans"
        ? await supabase.from("marketing_plans").upsert(payloads as MarketingPlanInsert[])
        : await supabase
            .from("marketing_schedule_rows")
            .upsert(payloads as MarketingScheduleRowInsert[]);

    if (error) {
      throw new Error(mapSupabaseError(error, "el contenido de marketing"));
    }
  }

  if (idsToDelete.length > 0) {
    const { error } = await supabase.from(table).delete().in("id", idsToDelete);

    if (error) {
      throw new Error(mapSupabaseError(error, "el contenido de marketing"));
    }
  }
}

export async function saveMarketingContentRecord(
  supabase: GymSupabaseClient,
  values: MarketingContentValues,
) {
  const planPayloads = values.plans.map(buildMarketingPlanPayload);
  const schedulePayloads = values.scheduleRows.map(buildMarketingScheduleRowPayload);

  await replaceMarketingTableRows(supabase, "marketing_plans", planPayloads);
  await replaceMarketingTableRows(supabase, "marketing_schedule_rows", schedulePayloads);
}

export async function listCmsDocumentsRecord(
  supabase: GymSupabaseClient,
  options?: { publishedOnly?: boolean },
) {
  let query = supabase.from("cms_documents").select("*").order("key", { ascending: true });

  if (options?.publishedOnly) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(mapSupabaseError(error, "los documentos CMS"));
  }

  return normalizeCmsDocuments(data);
}

export async function getCmsDocumentByKeyRecord(
  supabase: GymSupabaseClient,
  key: CmsDocumentKey,
  options?: { publishedOnly?: boolean },
) {
  let query = supabase.from("cms_documents").select("*").eq("key", key);

  if (options?.publishedOnly) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(mapSupabaseError(error, "el documento CMS"));
  }

  return data ? normalizeCmsDocument(data, key) : null;
}

export async function getCmsDocumentBySlugRecord(
  supabase: GymSupabaseClient,
  slug: string,
  options?: { publishedOnly?: boolean },
) {
  let query = supabase.from("cms_documents").select("*").eq("slug", slug);

  if (options?.publishedOnly) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(mapSupabaseError(error, "el documento CMS"));
  }

  return data && isCmsDocumentKey(data.key) ? normalizeCmsDocument(data, data.key) : null;
}

async function assertUniqueCmsSlug(
  supabase: GymSupabaseClient,
  slug: string,
  currentKey: CmsDocumentKey,
) {
  const { data, error } = await supabase
    .from("cms_documents")
    .select("key")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo validar el slug del documento.");
  }

  if (data && data.key !== currentKey) {
    throw new Error("Ya existe otro documento con ese slug.");
  }
}

export async function saveCmsDocumentRecord(
  supabase: GymSupabaseClient,
  values: CmsDocumentValues,
) {
  const payload = buildCmsDocumentPayload(values);
  await assertUniqueCmsSlug(supabase, payload.slug, values.key);

  const { error } = await supabase.from("cms_documents").upsert(payload);

  if (error) {
    throw new Error(mapSupabaseError(error, "el documento CMS"));
  }
}

export async function updateLeadStatusRecord(
  supabase: GymSupabaseClient,
  id: string,
  status: LeadStatus,
) {
  const { data, error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(mapSupabaseError(error, "el lead"));
  }

  if (!data) {
    throw new Error("El lead que intentas actualizar ya no existe.");
  }
}

export async function updateLeadFollowUpRecord(
  supabase: GymSupabaseClient,
  id: string,
  values: LeadFollowUpValues,
) {
  const payload = buildLeadFollowUpPayload(values);
  const { data, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(mapSupabaseError(error, "el seguimiento del lead"));
  }

  if (!data) {
    throw new Error("El lead que intentas actualizar ya no existe.");
  }
}
