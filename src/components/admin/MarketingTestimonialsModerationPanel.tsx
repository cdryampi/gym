import { Check, MessageSquareQuote, Star, X } from "lucide-react";

import { moderateMarketingTestimonial } from "@/app/(admin)/dashboard/actions";
import AdminSurface from "@/components/admin/AdminSurface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MarketingTestimonial } from "@/lib/data/marketing-content";
import { cn } from "@/lib/utils";

interface MarketingTestimonialsModerationPanelProps {
  testimonials: MarketingTestimonial[];
  disabledReason?: string;
}

const moderationRank = {
  pending: 0,
  approved: 1,
  rejected: 2,
} as const;

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusBadge(status: MarketingTestimonial["moderation_status"]) {
  switch (status) {
    case "approved":
      return { label: "Aprobada", variant: "success" as const };
    case "rejected":
      return { label: "Rechazada", variant: "default" as const };
    case "pending":
    default:
      return { label: "Pendiente", variant: "warning" as const };
  }
}

export default function MarketingTestimonialsModerationPanel({
  testimonials,
  disabledReason,
}: Readonly<MarketingTestimonialsModerationPanelProps>) {
  const sortedTestimonials = [...testimonials].sort((left, right) => {
    const rankDifference =
      moderationRank[left.moderation_status] - moderationRank[right.moderation_status];

    if (rankDifference !== 0) {
      return rankDifference;
    }

    return right.updated_at.localeCompare(left.updated_at);
  });

  if (sortedTestimonials.length === 0) {
    return (
      <AdminSurface inset className="border border-dashed border-black/10 bg-[#fbfbf8] p-8">
        <p className="text-sm font-medium text-[#5f6368]">
          Aun no hay resenas enviadas por socios.
        </p>
      </AdminSurface>
    );
  }

  return (
    <div className="space-y-4">
      {sortedTestimonials.map((testimonial) => {
        const statusBadge = getStatusBadge(testimonial.moderation_status);

        return (
          <AdminSurface
            key={testimonial.id}
            inset
            className="grid gap-5 border border-black/8 bg-[#fbfbf8] p-5 lg:grid-cols-[minmax(0,1fr)_240px]"
          >
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-[#111111]">
                      {testimonial.author_name}
                    </p>
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                    {testimonial.author_detail}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[#d71920]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={cn(
                        "h-4 w-4",
                        index < testimonial.rating ? "fill-current" : "text-black/15",
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#111111] text-white">
                  <MessageSquareQuote className="h-5 w-5 text-[#d71920]" />
                </div>
                <p className="max-w-3xl text-sm leading-7 text-[#4f5359]">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-5 border-l-0 border-black/8 pt-1 lg:border-l lg:pl-5">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7a7f87]">
                    Ultima actualizacion
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#111111]">
                    {formatUpdatedAt(testimonial.updated_at)}
                  </p>
                </div>
                {testimonial.approved_at ? (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7a7f87]">
                      Publicada
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#111111]">
                      {formatUpdatedAt(testimonial.approved_at)}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <form action={moderateMarketingTestimonial.bind(null, testimonial.id, "approved")}>
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full"
                    disabled={Boolean(disabledReason)}
                  >
                    <Check className="h-4 w-4" />
                    Aprobar
                  </Button>
                </form>
                <form action={moderateMarketingTestimonial.bind(null, testimonial.id, "rejected")}>
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={Boolean(disabledReason)}
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </Button>
                </form>
              </div>
            </div>
          </AdminSurface>
        );
      })}
    </div>
  );
}
