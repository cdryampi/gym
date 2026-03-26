import { cache } from "react";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import {
  cmsDocumentKeys,
  getDefaultCmsDocument,
  defaultCmsDocumentList,
  type CmsDocumentKey,
} from "@/lib/data/default-cms";
import { defaultSiteSettings } from "@/lib/data/default-content";
import { hasSupabasePublicEnv, hasSupabaseServiceRole } from "@/lib/env";
import { parseSeoKeywordsInput } from "@/lib/seo";
import { resolveTopbarVariant, toIsoDateTimeOrNull } from "@/lib/topbar";
import type { ContactFormValues } from "@/lib/validators/contact";
import type { CmsDocumentValues } from "@/lib/validators/cms-document";
import type { SiteSettingsValues } from "@/lib/validators/settings";
import { trimToNull } from "@/lib/utils";
import {
  mapStoreCategory,
  normalizeStoreCategoryPayload,
  normalizeStoreProductPayload,
  type StoreCategory,
} from "@/lib/data/store";
import type { StoreCategoryValues, StoreProductValues } from "@/lib/validators/store";

import type {
  Database,
  DBCmsDocument,
  DBProduct,
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
  isFallback: boolean;
  warning: string | null;
}

export interface DashboardSnapshot extends MarketingSnapshot {
  leads: Lead[];
}

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
        id: row.id,
        name: safeString(row.name, `Lead ${index + 1}`),
        email: safeString(row.email, "sin-email@invalid.local"),
        phone: trimToNull(row.phone),
        message: safeString(row.message, "Lead sin mensaje."),
        source: safeString(row.source, "website"),
        status,
        metadata: row.metadata ?? {},
        created_at: row.created_at ?? new Date(0).toISOString(),
      });

      return leads;
    }, [])
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
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

function mapSupabaseError(error: PostgrestError | Error | null | undefined, entityName: string) {
  const errorRecord = error as { message?: string } | null | undefined;
  const message = error instanceof Error ? error.message : errorRecord?.message;
  return message ?? `No se pudo guardar ${entityName}.`;
}

export const getMarketingSnapshot = cache(async (): Promise<MarketingSnapshot> => {
  if (!hasSupabasePublicEnv()) {
    return {
      settings: defaultSiteSettings,
      isFallback: true,
      warning: "Supabase no esta configurado. Se muestran datos fallback.",
    };
  }

  try {
    const supabase = createSupabasePublicClient();
    const { data: settings } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    return {
      settings: normalizeSiteSettings(settings),
      isFallback: false,
      warning: null,
    };
  } catch {
    return {
      settings: defaultSiteSettings,
      isFallback: true,
      warning: "No se pudieron cargar los datos reales de Supabase. Se muestra contenido fallback.",
    };
  }
});

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!hasSupabasePublicEnv()) {
    return {
      settings: defaultSiteSettings,
      leads: [],
      isFallback: true,
      warning: "Supabase no esta configurado. El dashboard usa contenido fallback.",
    };
  }

  const publicSupabase = createSupabasePublicClient();

  const { data: settings, error: settingsError } = await publicSupabase
    .from("site_settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  const warnings: string[] = [];

  if (settingsError) {
    warnings.push("No se pudieron cargar los ajustes reales del sitio. Se muestran valores fallback.");
  }

  if (!hasSupabaseServiceRole()) {
    warnings.push(
      "Configura SUPABASE_SERVICE_ROLE_KEY para leer contactos reales y operar el dashboard interno.",
    );
  }

  if (!hasSupabaseServiceRole()) {
    return {
      settings: settingsError ? defaultSiteSettings : normalizeSiteSettings(settings),
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
    leads: leadsError ? [] : normalizeLeads(leads),
    isFallback: warnings.length > 0,
    warning: warnings.length > 0 ? warnings.join(" ") : null,
  };
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

/**
 * SHOP / PRODUCTS QUERIES
 */

export const getStoreProducts = async (
  supabase: GymSupabaseClient,
  options?: { includeInactive?: boolean },
): Promise<DBProduct[]> => {
  let query = supabase.from("products").select("*").order("order", { ascending: true });

  if (!options?.includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data ?? [];
};

export const getStoreProductBySlug = async (
  supabase: GymSupabaseClient,
  slug: string,
): Promise<DBProduct | null> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching product ${slug}:`, error);
    return null;
  }

  return data;
};

export async function getStoreCategories(
  supabase: GymSupabaseClient,
  options?: { includeInactive?: boolean },
) {
  let query = supabase.from("store_categories").select("*").order("order", { ascending: true });

  if (!options?.includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching store categories:", error);
    return [];
  }

  return (data ?? []).map(mapStoreCategory);
}

export async function getStoreCategoryById(
  supabase: GymSupabaseClient,
  id: string,
): Promise<StoreCategory | null> {
  const { data, error } = await supabase
    .from("store_categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching store category ${id}:`, error);
    return null;
  }

  return data ? mapStoreCategory(data) : null;
}

async function assertUniqueCategorySlug(
  supabase: GymSupabaseClient,
  slug: string,
  currentId?: string,
) {
  const { data, error } = await supabase
    .from("store_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo validar el slug de la categoria.");
  }

  if (data && data.id !== currentId) {
    throw new Error("Ya existe una categoria con ese slug.");
  }
}

async function assertUniqueProductSlug(
  supabase: GymSupabaseClient,
  slug: string,
  currentId?: string,
) {
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo validar el slug del producto.");
  }

  if (data && data.id !== currentId) {
    throw new Error("Ya existe un producto con ese slug.");
  }
}

async function assertCategoryHierarchy(
  supabase: GymSupabaseClient,
  parentId: string | null,
  currentId?: string,
) {
  if (!parentId) {
    return;
  }

  if (currentId && parentId === currentId) {
    throw new Error("Una categoria no puede ser su propia categoria padre.");
  }

  const parent = await getStoreCategoryById(supabase, parentId);

  if (!parent) {
    throw new Error("La categoria padre seleccionada no existe.");
  }

  if (parent.parent_id) {
    throw new Error("Solo se permite un nivel de subcategoria en esta fase.");
  }
}

async function resolveRootCategoryEnum(
  supabase: GymSupabaseClient,
  categoryId: string,
): Promise<Database["public"]["Enums"]["store_category_type"]> {
  const categories = await getStoreCategories(supabase, { includeInactive: true });
  const byId = new Map(categories.map((category) => [category.id, category]));
  let current = byId.get(categoryId);

  while (current?.parent_id) {
    current = byId.get(current.parent_id);
  }

  const rootSlug = current?.slug?.toLowerCase();

  if (rootSlug === "suplementos" || rootSlug === "accesorios" || rootSlug === "merchandising") {
    return rootSlug;
  }

  // Fallback safe vertical for storefront compatibility if we can't map it perfectly
  return "suplementos";
}

export async function saveStoreCategoryRecord(
  supabase: GymSupabaseClient,
  values: StoreCategoryValues,
  categoryId?: string,
) {
  const payload = normalizeStoreCategoryPayload(values);
  await assertUniqueCategorySlug(supabase, payload.slug, categoryId);
  await assertCategoryHierarchy(supabase, payload.parent_id, categoryId);

  if (categoryId) {
    const { error } = await supabase
      .from("store_categories")
      .update(payload)
      .eq("id", categoryId);

    if (error) {
      throw new Error(mapSupabaseError(error, "la categoria"));
    }

    return categoryId;
  }

  const { data, error } = await supabase
    .from("store_categories")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(mapSupabaseError(error, "la categoria"));
  }

  return data.id;
}

export async function deactivateStoreCategoryRecord(supabase: GymSupabaseClient, categoryId: string) {
  const { error } = await supabase
    .from("store_categories")
    .update({ active: false })
    .eq("id", categoryId);

  if (error) {
    throw new Error(mapSupabaseError(error, "la categoria"));
  }
}

export async function saveStoreProductRecord(
  supabase: GymSupabaseClient,
  values: StoreProductValues,
  productId?: string,
) {
  const payload = normalizeStoreProductPayload(values);
  await assertUniqueProductSlug(supabase, payload.slug, productId);
  const rootCategory = await resolveRootCategoryEnum(supabase, payload.category_id);

  const dbPayload: Database["public"]["Tables"]["products"]["Insert"] = {
    name: payload.name,
    slug: payload.slug,
    category_id: payload.category_id,
    category: rootCategory,
    eyebrow: payload.eyebrow,
    short_description: payload.short_description,
    description: payload.description,
    price: payload.price,
    compare_price: payload.compare_price,
    discount_label: payload.discount_label,
    currency: payload.currency,
    stock_status: payload.stock_status,
    featured: payload.featured,
    pickup_only: payload.pickup_only,
    pickup_note: payload.pickup_note,
    pickup_summary: payload.pickup_summary,
    pickup_eta: payload.pickup_eta,
    tags: payload.tags,
    highlights: payload.highlights,
    benefits: payload.benefits,
    usage_steps: payload.usage_steps,
    images: payload.images,
    specifications: payload.specifications,
    cta_label: payload.cta_label,
    order: payload.order,
    active: payload.active,
  };

  if (productId) {
    const { error } = await supabase
      .from("products")
      .update(dbPayload)
      .eq("id", productId);

    if (error) {
      throw new Error(mapSupabaseError(error, "el producto"));
    }

    return productId;
  }

  const { data, error } = await supabase
    .from("products")
    .insert(dbPayload)
    .select("id")
    .single();

  if (error) {
    throw new Error(mapSupabaseError(error, "el producto"));
  }

  return data.id;
}

export async function deactivateStoreProductRecord(supabase: GymSupabaseClient, productId: string) {
  const { error } = await supabase
    .from("products")
    .update({ active: false })
    .eq("id", productId);

  if (error) {
    throw new Error(mapSupabaseError(error, "el producto"));
  }
}

export async function deleteStoreProductRecord(supabase: GymSupabaseClient, productId: string) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    throw new Error(mapSupabaseError(error, "el producto"));
  }
}

export async function deleteStoreCategoryRecord(supabase: GymSupabaseClient, categoryId: string) {
  // Check if has subcategories
  const { count: childrenCount, error: childrenError } = await supabase
    .from("store_categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", categoryId);

  if (childrenError) throw new Error(mapSupabaseError(childrenError, "la categoria"));
  if (childrenCount && childrenCount > 0) {
    throw new Error("No se puede eliminar una categoria que tiene subcategorias.");
  }

  // Check if has products
  const { count: productsCount, error: productsError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (productsError) throw new Error(mapSupabaseError(productsError, "la categoria"));
  if (productsCount && productsCount > 0) {
    throw new Error("No se puede eliminar una categoria que tiene productos asociados.");
  }

  const { error } = await supabase
    .from("store_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    throw new Error(mapSupabaseError(error, "la categoria"));
  }
}
