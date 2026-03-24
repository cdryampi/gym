import type { Metadata } from "next";

import LegalDocumentPage from "@/components/marketing/LegalDocumentPage";
import { buildCmsDocumentMetadata } from "@/lib/data/cms";
import { getLegalDocumentOrFallback } from "@/lib/data/legal-pages";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const document = await getLegalDocumentOrFallback("aviso-legal", "legal-notice");
  return buildCmsDocumentMetadata(document);
}

export default async function LegalNoticePage() {
  const document = await getLegalDocumentOrFallback("aviso-legal", "legal-notice");
  return <LegalDocumentPage document={document} />;
}
