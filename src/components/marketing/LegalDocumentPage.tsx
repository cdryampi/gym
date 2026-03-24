import Link from "next/link";

import SimpleMarkdown from "@/components/content/SimpleMarkdown";
import { Button } from "@/components/ui/button";
import type { DBCmsDocument } from "@/lib/supabase/database.types";

export default function LegalDocumentPage({
  document,
}: Readonly<{
  document: DBCmsDocument;
}>) {
  return (
    <section className="section-shell py-12 md:py-16">
      <div className="mx-auto max-w-4xl border border-black/8 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(17,17,17,0.35)] md:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
          Informacion legal
        </p>
        <h1 className="mt-4 font-display text-4xl uppercase leading-none text-[#111111] md:text-6xl">
          {document.title}
        </h1>
        {document.summary ? (
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#4b5563]">{document.summary}</p>
        ) : null}

        <SimpleMarkdown content={document.body_markdown} className="mt-8 space-y-5" />

        {document.cta_label && document.cta_href ? (
          <div className="mt-10 flex flex-wrap gap-3 border-t border-black/8 pt-6">
            <Button asChild>
              <Link href={document.cta_href}>{document.cta_label}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
