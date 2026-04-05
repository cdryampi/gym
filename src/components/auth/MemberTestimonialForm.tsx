"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MessageSquareQuote, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { MemberMarketingTestimonialViewModel } from "@/lib/data/member-account";
import {
  memberMarketingTestimonialSchema,
  type MemberMarketingTestimonialValues,
} from "@/lib/validators/marketing-testimonial";
import { cn } from "@/lib/utils";

interface MemberTestimonialFormProps {
  initialTestimonial: MemberMarketingTestimonialViewModel | null;
}

type TestimonialResponse = {
  error?: string;
  message?: string;
  mode?: "created" | "updated";
  testimonial?: MemberMarketingTestimonialViewModel | null;
};

function getStatusLabel(status: MemberMarketingTestimonialViewModel["moderation_status"]) {
  switch (status) {
    case "approved":
      return "Aprobada";
    case "rejected":
      return "Rechazada";
    case "pending":
    default:
      return "Pendiente";
  }
}

function getStatusTone(status: MemberMarketingTestimonialViewModel["moderation_status"]) {
  switch (status) {
    case "approved":
      return "bg-emerald-500/10 text-emerald-700";
    case "rejected":
      return "bg-red-500/10 text-red-700";
    case "pending":
    default:
      return "bg-amber-500/10 text-amber-700";
  }
}

async function parseJson(response: Response) {
  return (await response.json().catch(() => ({}))) as TestimonialResponse;
}

export default function MemberTestimonialForm({
  initialTestimonial,
}: Readonly<MemberTestimonialFormProps>) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] =
    useState<MemberMarketingTestimonialViewModel | null>(initialTestimonial);

  const form = useForm<MemberMarketingTestimonialValues>({
    resolver: zodResolver(memberMarketingTestimonialSchema),
    defaultValues: {
      quote: initialTestimonial?.quote ?? "",
      rating: initialTestimonial?.rating ?? 5,
    },
  });

  const rating = form.watch("rating") ?? 5;

  const moderationCopy = useMemo(() => {
    if (!currentTestimonial) {
      return "Tu opinion se publicara cuando el equipo la apruebe.";
    }

    switch (currentTestimonial.moderation_status) {
      case "approved":
        return "Tu resena esta publicada en la portada mientras mantenga este estado.";
      case "rejected":
        return "Puedes ajustarla y enviarla de nuevo para una nueva revision.";
      case "pending":
      default:
        return "Tu resena esta en revision antes de mostrarse en la portada.";
    }
  }, [currentTestimonial]);

  async function handleSubmit(values: MemberMarketingTestimonialValues) {
    setFeedback(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/member-account/testimonial", {
        body: JSON.stringify(values),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      });
      const payload = await parseJson(response);

      if (!response.ok) {
        setFeedback(payload.error ?? "No se pudo guardar tu resena.");
        return;
      }

      if (payload.testimonial) {
        setCurrentTestimonial(payload.testimonial);
        form.reset({
          quote: payload.testimonial.quote,
          rating: payload.testimonial.rating,
        });
      }

      setFeedback(payload.message ?? "Tu resena quedo pendiente de revision.");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="rounded-none border-black/10 shadow-xl overflow-hidden">
      <CardContent className="space-y-8 p-10">
        <div className="flex flex-col gap-5 border-b border-black/5 pb-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-[#111111]">
                <MessageSquareQuote className="h-5 w-5 text-[#d71920]" />
              </div>
              <h3 className="font-display text-2xl font-black uppercase tracking-tight italic text-[#111111]">
                Tu resena publica
              </h3>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-[#5f6368]">
              Comparte tu experiencia real en Titan Gym. Solo puedes tener una resena activa, pero
              puedes actualizarla cuando quieras y volvera a revision.
            </p>
          </div>

          {currentTestimonial ? (
            <Badge
              variant="muted"
              className={cn(
                "h-8 rounded-none border-none px-4 text-[10px] font-black uppercase tracking-[0.22em]",
                getStatusTone(currentTestimonial.moderation_status),
              )}
            >
              {getStatusLabel(currentTestimonial.moderation_status)}
            </Badge>
          ) : (
            <Badge
              variant="muted"
              className="h-8 rounded-none border-none bg-black/5 px-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#111111]"
            >
              Sin publicar
            </Badge>
          )}
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="rating"
                render={() => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a7f87]">
                      Valoracion
                    </FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-3">
                        {Array.from({ length: 5 }).map((_, index) => {
                          const value = index + 1;
                          const isActive = value <= rating;

                          return (
                            <button
                              key={value}
                              type="button"
                              aria-label={`${value} estrellas`}
                              aria-pressed={value === rating}
                              disabled={isPending}
                              onClick={() => {
                                form.setValue("rating", value, {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: true,
                                });
                              }}
                              className={cn(
                                "flex h-14 min-w-14 items-center justify-center border px-4 transition-all",
                                isActive
                                  ? "border-[#111111] bg-[#111111] text-[#f4c430]"
                                  : "border-black/10 bg-white text-black/20 hover:border-[#111111]",
                              )}
                            >
                              <Star className={cn("h-6 w-6", isActive && "fill-current")} />
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormDescription className="text-[11px] font-medium text-[#7a7f87]">
                      Elige de 1 a 5 estrellas segun tu experiencia.
                    </FormDescription>
                    <FormMessage className="text-[10px] font-black uppercase" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quote"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a7f87]">
                      Comentario
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={6}
                        className="rounded-none border-black/10 bg-[#fcfcfa] text-sm leading-6 focus-visible:ring-[#111111]"
                        placeholder="Cuenta que resultados, ambiente o acompanamiento te hicieron quedarte."
                      />
                    </FormControl>
                    <div className="flex items-center justify-between gap-4">
                      <FormDescription className="text-[11px] font-medium text-[#7a7f87]">
                        Tu nombre y antiguedad se rellenan automaticamente desde tu ficha.
                      </FormDescription>
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-black/25">
                        {field.value.length}/320
                      </span>
                    </div>
                    <FormMessage className="text-[10px] font-black uppercase" />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-4 border-t border-black/5 pt-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7a7f87]">
                    Moderacion
                  </p>
                  <p className="text-sm text-[#5f6368]">{feedback ?? moderationCopy}</p>
                </div>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-14 rounded-none bg-[#111111] px-12 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-lg transition-all hover:bg-[#d71920]"
                >
                  {isPending ? <Loader2 className="mr-3 h-4 w-4 animate-spin" /> : null}
                  {currentTestimonial ? "Actualizar resena" : "Enviar resena"}
                </Button>
              </div>
            </form>
          </Form>

          <div className="space-y-5 border border-black/10 bg-[#111111] p-8 text-white shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">
              Vista publica
            </p>

            <div className="flex gap-1.5 text-[#f4c430]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn("h-5 w-5", index < rating ? "fill-current" : "text-white/15")}
                />
              ))}
            </div>

            <p className="font-display text-2xl font-black uppercase tracking-tight italic text-white">
              {currentTestimonial?.author_name ?? "Tu nombre se mostrara aqui"}
            </p>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d71920]/80">
              {currentTestimonial?.author_detail ?? "Miembro verificado"}
            </p>

            <p className="border-l-2 border-[#d71920] pl-4 text-sm leading-7 text-white/75">
              &ldquo;{form.watch("quote") || "Tu comentario publicado aparecera aqui cuando lo guardes."}
              &rdquo;
            </p>

            <div className="flex items-center gap-4 border-t border-white/10 pt-6">
              <div className="flex h-14 w-14 items-center justify-center bg-white text-lg font-black uppercase text-[#111111]">
                {currentTestimonial?.author_initials ?? "TG"}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  Estado actual
                </p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.08em] text-white">
                  {currentTestimonial
                    ? getStatusLabel(currentTestimonial.moderation_status)
                    : "Pendiente de envio"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
