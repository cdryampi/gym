import Link from "next/link";

import type { SiteSettings } from "@/lib/supabase/database.types";
import { formatTopbarDeadline, resolveActiveTopbar } from "@/lib/topbar";
import { cn } from "@/lib/utils";

const topbarStyles = {
  promotion: "bg-[#d71920] text-white",
  announcement: "bg-[#111111] text-white",
  notice: "bg-[#f7f4ef] text-[#111111] border-b border-black/10",
} as const;

const badgeStyles = {
  promotion: "bg-white/12 text-white",
  announcement: "bg-[#d71920] text-white",
  notice: "bg-[#d71920] text-white",
} as const;

const variantLabels = {
  promotion: "Promo",
  announcement: "Anuncio",
  notice: "Aviso",
} as const;

export default function SiteTopbar({ settings }: { settings: SiteSettings }) {
  const topbar = resolveActiveTopbar(settings);

  if (!topbar) {
    return null;
  }

  const deadline = formatTopbarDeadline(topbar.expiresAt);
  const palette = topbarStyles[topbar.variant];
  const badgePalette = badgeStyles[topbar.variant];

  return (
    <div className={cn(palette, "relative z-[60]")}>
      <div className="section-shell flex items-center justify-between py-2 sm:py-3">
        {/* Left: Badge + Text */}
        <div className="flex items-center gap-3 overflow-hidden">
          <span className={cn(
            "hidden shrink-0 items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] xs:inline-flex",
            badgePalette
          )}>
            {variantLabels[topbar.variant]}
          </span>
          <p className="text-[11px] font-medium leading-tight sm:text-sm">
            {topbar.text}
          </p>
        </div>

        {/* Right: Deadline + CTA */}
        <div className="flex shrink-0 items-center gap-4">
          {deadline ? (
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.15em] opacity-70 md:block">
              Hasta {deadline}
            </span>
          ) : null}
          {topbar.ctaLabel && topbar.ctaUrl ? (
            <Link
              href={topbar.ctaUrl}
              className="inline-flex items-center justify-center border border-current/20 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] transition hover:border-current/50 hover:bg-black/10 sm:px-6 sm:py-2.5 sm:text-[10px]"
            >
              {topbar.ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
