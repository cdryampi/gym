import { Star } from "lucide-react";

import type { MarketingTestimonial } from "@/lib/data/marketing-content";
import { cn } from "@/lib/utils";

interface TestimonialsSectionProps {
  testimonials: MarketingTestimonial[];
}

export default function TestimonialsSection({
  testimonials,
}: Readonly<TestimonialsSectionProps>) {
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section
      id="testimonios"
      className="section-anchor relative overflow-hidden bg-[#111111] py-24 md:py-32"
    >
      <div className="absolute inset-0 athletic-grid opacity-10" />
      <div className="section-shell relative z-10">
        <div className="mb-16">
          <p className="section-kicker">Resultados Reales</p>
          <h2 className="section-title text-white italic">
            La Comunidad{" "}
            <span className="text-accent underline decoration-accent/20 underline-offset-8">
              Titan
            </span>
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="flex flex-col border border-white/5 bg-white/5 p-10 transition-all duration-500 hover:bg-white/10"
            >
              <div className="flex gap-1.5 text-accent">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      "h-4 w-4",
                      index < testimonial.rating ? "fill-current" : "text-white/15",
                    )}
                  />
                ))}
              </div>

              <p className="mt-8 text-xl font-medium leading-relaxed text-white/80 italic">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <div className="mt-auto flex items-center gap-5 pt-10">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-accent font-display text-xl font-bold uppercase text-white">
                  {testimonial.author_initials}
                </div>
                <div>
                  <p className="font-display text-xl font-bold uppercase tracking-tight text-white">
                    {testimonial.author_name}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/60">
                    {testimonial.author_detail}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
