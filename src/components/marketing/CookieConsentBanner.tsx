"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { persistCookieConsent } from "@/lib/cms/cookie-consent";
import type { DBCmsDocument } from "@/lib/supabase/database.types";

export default function CookieConsentBanner({
  document,
  initialConsent,
}: Readonly<{
  document: DBCmsDocument;
  initialConsent?: "accepted" | "rejected";
}>) {
  const [consent, setConsent] = useState<"accepted" | "rejected" | null>(
    initialConsent ?? null,
  );

  if (consent) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-black/10 bg-[#111111] text-white shadow-[0_-24px_60px_-42px_rgba(17,17,17,0.8)]">
      <div className="section-shell flex flex-col gap-4 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f7b4b7]">
            {document.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/85">{document.summary}</p>
          <p className="mt-2 text-sm leading-6 text-white/65">{document.body_markdown}</p>
          {document.cta_label && document.cta_href ? (
            <Link
              href={document.cta_href}
              className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-[#f6d3d4] underline-offset-4 hover:underline"
            >
              {document.cta_label}
            </Link>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="border-white/20 bg-transparent text-white hover:border-white/35 hover:bg-white/10 hover:text-white"
            onClick={() => {
              persistCookieConsent("rejected");
              setConsent("rejected");
            }}
          >
            Rechazar
          </Button>
          <Button
            type="button"
            onClick={() => {
              persistCookieConsent("accepted");
              setConsent("accepted");
            }}
          >
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
}
