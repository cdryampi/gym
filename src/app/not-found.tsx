import SystemStateScreen from "@/components/system/SystemStateScreen";
import { getCmsDocumentByKey } from "@/lib/data/cms";

export default async function NotFoundPage() {
  const document = await getCmsDocumentByKey("system-error-not-found");
  return <SystemStateScreen document={document} />;
}
