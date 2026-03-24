"use client";

import { useEffect, useMemo, useState } from "react";

import SystemStateScreen from "@/components/system/SystemStateScreen";
import { getDefaultCmsDocument, type CmsDocumentKey } from "@/lib/data/default-cms";
import type { DBCmsDocument } from "@/lib/supabase/database.types";

export default function CmsSystemStateClient({
  documentKey,
  initialDocument,
  reset,
  resetLabel,
}: Readonly<{
  documentKey: CmsDocumentKey;
  initialDocument?: DBCmsDocument;
  reset?: () => void;
  resetLabel?: string;
}>) {
  const fallback = useMemo(
    () => initialDocument ?? getDefaultCmsDocument(documentKey),
    [documentKey, initialDocument],
  );
  const [document, setDocument] = useState(fallback);

  useEffect(() => {
    let isMounted = true;

    void fetch(`/api/cms-document?key=${documentKey}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("cms-unavailable");
        }

        return (await response.json()) as { document?: DBCmsDocument };
      })
      .then((payload) => {
        if (isMounted && payload.document) {
          setDocument(payload.document);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDocument(fallback);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [documentKey, fallback]);

  return <SystemStateScreen document={document} onReset={reset} resetLabel={resetLabel} />;
}
