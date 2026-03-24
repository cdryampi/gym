import type { Metadata } from "next";

import LegalDocumentPage from "@/components/marketing/LegalDocumentPage";
import { buildCmsDocumentMetadata } from "@/lib/data/cms";
import { getLegalDocumentOrFallback } from "@/lib/data/legal-pages";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const document = await getLegalDocumentOrFallback("privacidad", "legal-privacy");
  return buildCmsDocumentMetadata(document);
}

export default async function PrivacyPage() {
  const document = await getLegalDocumentOrFallback("privacidad", "legal-privacy");
  return <LegalDocumentPage document={document} />;
}
