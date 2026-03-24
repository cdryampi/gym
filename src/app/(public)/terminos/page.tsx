import type { Metadata } from "next";

import LegalDocumentPage from "@/components/marketing/LegalDocumentPage";
import { buildCmsDocumentMetadata } from "@/lib/data/cms";
import { getLegalDocumentOrFallback } from "@/lib/data/legal-pages";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const document = await getLegalDocumentOrFallback("terminos", "legal-terms");
  return buildCmsDocumentMetadata(document);
}

export default async function TermsPage() {
  const document = await getLegalDocumentOrFallback("terminos", "legal-terms");
  return <LegalDocumentPage document={document} />;
}
