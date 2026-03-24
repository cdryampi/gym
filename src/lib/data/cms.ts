import type { Metadata } from "next";

import {
  cmsDocumentKeys,
  getDefaultCmsDocument,
  type CmsDocumentKey,
} from "@/lib/data/default-cms";
import { SITE_URL } from "@/lib/seo";
import {
  getPublicCmsSnapshot,
  normalizeCmsDocument,
  type CmsSnapshot,
} from "@/lib/supabase/queries";
import type { DBCmsDocument } from "@/lib/supabase/database.types";

export async function getPublicCmsData(): Promise<CmsSnapshot> {
  return getPublicCmsSnapshot();
}

export async function getCmsDocumentByKey(key: CmsDocumentKey) {
  const snapshot = await getPublicCmsData();
  return snapshot.byKey[key] ?? getDefaultCmsDocument(key);
}

export async function getCmsDocumentBySlug(slug: string) {
  const snapshot = await getPublicCmsData();
  const document = snapshot.documents.find((entry) => entry.slug === slug);

  return document ?? null;
}

export async function getFooterLegalLinks() {
  const snapshot = await getPublicCmsData();

  return cmsDocumentKeys
    .map((key) => snapshot.byKey[key])
    .filter((document) => document.kind === "legal" && document.is_published)
    .map((document) => ({
      key: document.key,
      href: `/${document.slug}`,
      label: document.title,
    }));
}

export function getFallbackCmsDocument(key: CmsDocumentKey) {
  return normalizeCmsDocument(getDefaultCmsDocument(key), key);
}

export function buildCmsDocumentMetadata(
  document: DBCmsDocument,
  canonicalPath?: string,
): Metadata {
  const canonical = new URL(canonicalPath ?? `/${document.slug}`, SITE_URL).toString();

  return {
    title: document.seo_title || document.title,
    description: document.seo_description || document.summary,
    alternates: {
      canonical,
    },
    openGraph: {
      title: document.seo_title || document.title,
      description: document.seo_description || document.summary,
      url: canonical,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: document.seo_title || document.title,
      description: document.seo_description || document.summary,
    },
  };
}
