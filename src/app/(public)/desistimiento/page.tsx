import type { Metadata } from "next";

import LegalDocumentPage from "@/components/marketing/LegalDocumentPage";
import { buildCmsDocumentMetadata } from "@/lib/data/cms";
import { getLegalDocumentOrFallback } from "@/lib/data/legal-pages";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const document = await getLegalDocumentOrFallback("desistimiento", "legal-withdrawal");
  return buildCmsDocumentMetadata(document);
}

export default async function WithdrawalPage() {
  const document = await getLegalDocumentOrFallback("desistimiento", "legal-withdrawal");
  return <LegalDocumentPage document={document} />;
}
