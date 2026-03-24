"use client";

import CmsSystemStateClient from "@/components/system/CmsSystemStateClient";

export default function GlobalError({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <html lang="es">
      <body>
        <CmsSystemStateClient
          documentKey="system-error-generic"
          reset={reset}
          resetLabel="Recargar"
        />
      </body>
    </html>
  );
}
