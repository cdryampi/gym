import { notFound } from "next/navigation";

import { getCmsDocumentBySlug, getFallbackCmsDocument } from "@/lib/data/cms";
import type { CmsDocumentKey } from "@/lib/data/default-cms";

export async function getLegalDocumentOrFallback(slug: string, fallbackKey: CmsDocumentKey) {
  const document = await getCmsDocumentBySlug(slug);

  if (document && document.kind === "legal" && document.is_published) {
    return document;
  }

  return getFallbackCmsDocument(fallbackKey);
}

export async function getLegalDocumentOrNotFound(slug: string) {
  const document = await getCmsDocumentBySlug(slug);

  if (!document || document.kind !== "legal" || !document.is_published) {
    notFound();
  }

  return document;
}
