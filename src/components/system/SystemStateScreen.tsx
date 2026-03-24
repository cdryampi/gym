import Link from "next/link";

import SimpleMarkdown from "@/components/content/SimpleMarkdown";
import { Button } from "@/components/ui/button";
import type { DBCmsDocument } from "@/lib/supabase/database.types";

export default function SystemStateScreen({
  document,
  resetLabel,
  onReset,
}: Readonly<{
  document: DBCmsDocument;
  resetLabel?: string;
  onReset?: () => void;
}>) {
  return (
    <div className="section-shell flex min-h-[55vh] items-center justify-center py-16">
      <div className="w-full max-w-3xl border border-black/8 bg-white p-8 text-center shadow-[0_24px_70px_-54px_rgba(17,17,17,0.35)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#d71920]">
          Estado del sistema
        </p>
        <h1 className="mt-6 font-display text-4xl font-extrabold uppercase leading-[0.9] text-[#111111] sm:text-6xl">
          {document.title}
        </h1>
        {document.summary ? (
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#6b7280]">
            {document.summary}
          </p>
        ) : null}
        {document.body_markdown ? (
          <SimpleMarkdown content={document.body_markdown} className="mx-auto mt-6 max-w-2xl space-y-3 text-left" />
        ) : null}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {onReset ? (
            <Button type="button" onClick={onReset}>
              {resetLabel ?? "Reintentar"}
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href={document.cta_href ?? "/"}>{document.cta_label ?? "Volver al inicio"}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
