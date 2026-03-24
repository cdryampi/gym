import type { Metadata } from "next";

import LegalDocumentPage from "@/components/marketing/LegalDocumentPage";
import { buildCmsDocumentMetadata } from "@/lib/data/cms";
import { getLegalDocumentOrFallback } from "@/lib/data/legal-pages";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const document = await getLegalDocumentOrFallback("cookies", "legal-cookies");
  return buildCmsDocumentMetadata(document);
}

export default async function CookiesPolicyPage() {
  const document = await getLegalDocumentOrFallback("cookies", "legal-cookies");
  return <LegalDocumentPage document={document} />;
}
