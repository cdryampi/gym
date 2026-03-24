"use client";

import CmsSystemStateClient from "@/components/system/CmsSystemStateClient";

export default function AppError({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <CmsSystemStateClient
      documentKey="system-error-generic"
      reset={reset}
      resetLabel="Reintentar"
    />
  );
}
