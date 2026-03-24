import type { Metadata } from "next";

import SystemStateScreen from "@/components/system/SystemStateScreen";
import { buildCmsDocumentMetadata, getCmsDocumentByKey } from "@/lib/data/cms";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const document = await getCmsDocumentByKey("system-error-access");
  return buildCmsDocumentMetadata(document, "/acceso-restringido");
}

export default async function RestrictedAccessPage() {
  const document = await getCmsDocumentByKey("system-error-access");
  return <SystemStateScreen document={document} />;
}
