import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { SiteSettings } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGE = "/images/hero/banner-1.png";
const DEFAULT_VIDEO_PATH = "/video/video.mp4";
const DEFAULT_HERO_TITLE = "EL PODER DE TU PROGRESO COMIENZA AQUI";

function splitHeroTitle(title: string | null) {
  const words = (title?.trim() || DEFAULT_HERO_TITLE).split(/\s+/);
  const splitIndex = Math.max(1, Math.ceil(words.length / 2));

  return {
    left: words.slice(0, splitIndex),
    right: words.slice(splitIndex),
  };
}

function renderTitleLines(words: string[], accentLastWord = false) {
  return words.map((word, index) => (
    <span
      key={`${word}-${index}`}
      className={cn(
        "block text-white",
        accentLastWord && index === words.length - 1 && words.length > 1 && "text-accent",
      )}
    >
      {word}
    </span>
  ));
}

export default function HeroSection({ settings }: { settings: SiteSettings }) {
  const heroVideoUrl = settings.hero_video_url ?? DEFAULT_VIDEO_PATH;
  const titleParts = splitHeroTitle(settings.hero_title);

  return (
    <section id="inicio" className="relative section-anchor min-h-screen overflow-hidden bg-[#090909]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(215,25,32,0.1)_0%,_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(215,25,32,0.08)_0%,_transparent_50%)]" />

      <div className="section-shell relative z-10 flex min-h-screen flex-col justify-center py-24">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="animate-slide-up flex items-center gap-3 reveal-1 [animation-fill-mode:forwards]">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent">
                {settings.hero_badge || "Entrenamiento Premium en Lima"}
              </p>
            </div>

            <h2 className="animate-slide-up mt-8 font-display text-[52px] font-extrabold uppercase italic leading-[1] tracking-tight reveal-2 sm:text-[72px] lg:text-[100px] [animation-fill-mode:forwards]">
              {renderTitleLines([...titleParts.left, ...titleParts.right], true)}
            </h2>

            <p className="animate-slide-up mt-10 max-w-xl text-[16px] leading-relaxed text-white/60 reveal-4 sm:text-[18px] [animation-fill-mode:forwards]">
              {settings.hero_description}
            </p>

            <div className="animate-slide-up mt-12 flex flex-col gap-4 reveal-4 sm:flex-row [animation-fill-mode:forwards]">
              <Button
                asChild
                className="btn-athletic bg-accent text-white !h-16 !px-10 hover:bg-white hover:text-black"
              >
                <Link href="#planes" className="flex items-center gap-3">
                  <span className="flex flex-col items-start leading-none">
                    <span className="text-[10px] opacity-70">Ver</span>
                    <span className="text-sm font-black">PLANES</span>
                  </span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="btn-athletic border-white/10 bg-white/5 text-white !h-16 !px-10 hover:bg-white/10"
              >
                <Link href="#contacto">
                  <span className="flex flex-col items-start leading-none">
                    <span className="text-[10px] opacity-70">Reserva tu</span>
                    <span className="text-sm font-black">PRUEBA</span>
                  </span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="animate-slide-up relative mx-auto w-full max-w-[420px] reveal-2 [animation-fill-mode:forwards]">
              <div className="pointer-events-none absolute inset-0 -z-10 bg-accent/20 blur-[120px]" />

              <div className="relative aspect-[4/5] overflow-hidden border border-white/10">
                <Image
                  src={FALLBACK_IMAGE}
                  alt="Nova Forza Hero"
                  fill
                  className="object-cover opacity-20 blur-xl"
                  priority
                />
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={FALLBACK_IMAGE}
                  className="absolute inset-0 h-full w-full object-cover"
                >
                  <source src={heroVideoUrl} type="video/mp4" />
                </video>

                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#090909_0%,transparent_20%,transparent_80%,#090909_100%)]" />
              </div>
            </div>

            <div className="animate-fade-in mt-14 hidden border-t border-white/10 pt-8 reveal-4 lg:block [animation-fill-mode:forwards]">
              <p className="max-w-xs text-[11px] font-bold uppercase leading-relaxed tracking-[0.2em] text-white/30">
                Fuerza con estructura, coaches presentes y un espacio pensado para meterle en serio.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-fade-in absolute bottom-12 left-1/2 -translate-x-1/2 reveal-4 [animation-fill-mode:forwards]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-12 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent">
            <div className="animate-scroll-dot absolute inset-x-0 top-0 mx-auto h-[6px] w-[2px] bg-accent" />
          </div>
        </div>
      </div>
    </section>
  );
}
