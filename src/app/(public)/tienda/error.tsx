"use client";

import CmsSystemStateClient from "@/components/system/CmsSystemStateClient";

export default function ShopError({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <CmsSystemStateClient
      documentKey="system-error-catalog"
      reset={reset}
      resetLabel="Reintentar tienda"
    />
  );
}
