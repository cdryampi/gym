import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { SiteSettings } from "@/lib/supabase/database.types";

interface SiteFooterProps {
  settings: SiteSettings;
  legalLinks: Array<{
    key: string;
    href: string;
    label: string;
  }>;
}

const EXPLORE_LINKS = [
  { href: "#inicio", label: "INICIO" },
  { href: "#planes", label: "PLANES" },
  { href: "#horarios", label: "HORARIOS" },
  { href: "#entrenadores", label: "ENTRENADORES" },
  { href: "/tienda", label: "TIENDA" },
  { href: "#contacto", label: "CONTACTO" },
];

const SUPPORT_LINKS = [
  { href: "#contacto", label: "NUESTRA HISTORIA" },
  { href: "#contacto", label: "METODOLOGIA" },
  { href: "#contacto", label: "ENTRENAMIENTOS" },
  { href: "#contacto", label: "MEMBRESIAS" },
  { href: "/tienda", label: "TIENDA ONLINE" },
  { href: "#contacto", label: "PREGUNTAS FRECUENTES" },
  { href: "#contacto", label: "POLITICAS DE PRIVACIDAD" },
  { href: "#contacto", label: "LIBRO DE RECLAMACIONES" },
];

export default function SiteFooter({
  settings,
  legalLinks,
}: Readonly<SiteFooterProps>) {
  return (
    <footer 
      id="site-footer" 
      data-component="site-footer"
      className="relative overflow-hidden bg-secondary pb-12 pt-32 text-white"
    >
      <div className="section-shell relative z-10">
        <div className="mb-24 flex flex-col items-center justify-between gap-12 lg:flex-row lg:items-end">
          <div className="max-w-2xl text-center lg:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              Comienza hoy
            </p>
            <h2 className="mt-6 font-display text-5xl font-black uppercase italic leading-none tracking-tighter sm:text-7xl lg:text-8xl">
              Unete al <span className="text-primary">Club</span>
            </h2>
            <p className="mt-8 text-lg font-medium text-white/40 leading-relaxed">
              Recibe consejos de entrenamiento, preventas exclusivas y novedades de la comunidad{" "}
              <span className="text-white">Nuova Forza</span>.
            </p>
          </div>

          <div className="w-full lg:w-auto">
            <div className="flex flex-col gap-4 sm:flex-row">
              <input
                type="email"
                placeholder="TU EMAIL"
                className="h-16 w-full border border-white/10 bg-white/5 px-8 text-xs font-bold tracking-widest outline-none transition-all focus:border-primary/50 focus:bg-white/10 lg:w-80 rounded-[var(--radius-base)]"
                required
              />
              <Button className="h-16 bg-white text-black hover:bg-primary hover:text-white px-10 rounded-[var(--radius-base)] font-black uppercase tracking-widest text-[10px]">
                Suscribirme
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4 text-center text-[9px] font-bold uppercase tracking-widest text-white/20 lg:text-left">
              Al suscribirte, aceptas nuestra politica de privacidad.
            </p>
          </div>
        </div>

        <div className="grid gap-16 border-t border-white/5 pt-20 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block" aria-label="Ir al inicio">
              <span className="relative block h-[60px] w-40">
                <Image
                  src="/images/logo/logo-trans.webp"
                  alt={`${settings.site_name} Logo`}
                  fill
                  sizes="160px"
                  className="object-contain opacity-90"
                />
              </span>
            </Link>
            <p className="mt-8 max-w-sm text-sm font-medium leading-8 text-white/40">
              {settings.site_name} es un gimnasio local orientado a fuerza, progreso real y una experiencia seria y cercana. 
              Entrena con nosotros y supera tus limites.
            </p>
            <div className="mt-10 flex gap-4">
              <Link
                href="https://instagram.com/gimnasionuovaforza"
                target="_blank"
                className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5 transition-all hover:bg-primary hover:border-primary rounded-[var(--radius-base)]"
                aria-label="Seguir en Instagram"
              >
                <span className="text-[10px] font-black">IG</span>
              </Link>
              <Link
                href="https://facebook.com/GYM.NUOVAFORZA"
                target="_blank"
                className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5 transition-all hover:bg-primary hover:border-primary rounded-[var(--radius-base)]"
                aria-label="Seguir en Facebook"
              >
                <span className="text-[10px] font-black">FB</span>
              </Link>
            </div>
          </div>

          <div className="grid gap-12 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
            <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Explorar</h3>
              <ul className="space-y-4">
                {EXPLORE_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs font-bold uppercase tracking-widest text-white/30 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Soporte</h3>
              <ul className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-1">
                {SUPPORT_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[10px] font-bold uppercase tracking-widest text-white/30 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Sede Principal</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <MapPin className="h-5 w-5 shrink-0 text-primary" />
                  <p className="text-xs font-medium leading-relaxed text-white/40 uppercase">
                    San José # 371 - 2°piso, Chiclayo, Peru
                  </p>
                </div>
                <div className="flex gap-4">
                  <Phone className="h-5 w-5 shrink-0 text-primary" />
                  <Link href="https://wa.me/51901900300" className="text-xs font-bold tracking-widest text-white/80 hover:text-primary">
                    +51 90 190 03 00
                  </Link>
                </div>
                <div className="flex gap-4">
                  <Mail className="h-5 w-5 shrink-0 text-primary" />
                  <Link href="mailto:info@nuovaforzagym.com" className="text-xs font-bold tracking-widest text-white/80 hover:text-primary">
                    INFO@NUOVAFORZAGYM.COM
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-32 flex flex-col items-center justify-between gap-8 border-t border-white/5 pt-12 text-center lg:flex-row lg:text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            © {new Date().getFullYear()} {settings.site_name} Gym. Precision y Poder.
          </p>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {legalLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="text-[9px] font-black uppercase tracking-widest text-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/10">
              Chiclayo - Peru
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
