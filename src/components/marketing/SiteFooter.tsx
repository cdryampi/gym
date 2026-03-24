import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";

import { novaForzaHomeContent } from "@/lib/data/nova-forza-content";
import type { SiteSettings } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";

export default function SiteFooter({
  settings,
  legalLinks = [],
}: {
  settings: SiteSettings;
  legalLinks?: Array<{
    key: string;
    href: string;
    label: string;
  }>;
}) {
  const whatsappHref = settings.whatsapp_url?.trim() ? settings.whatsapp_url : "#contacto";
  const contactEmail = settings.contact_email ?? "info@novaforza.pe";

  return (
    <footer className="relative overflow-hidden bg-[#070708] pt-32 pb-12 text-white">
      {/* High-Impact Background Text */}
      <div className="pointer-events-none absolute -bottom-12 left-0 w-full overflow-hidden leading-none select-none">
        <span className="athletic-outline block text-[22vw] font-black uppercase tracking-tighter opacity-10">
          NOVA FORZA
        </span>
      </div>

      <div className="section-shell relative z-10">
        {/* Top: Newsletter / CTA Section */}
        <div className="mb-24 grid gap-12 border-b border-white/5 pb-24 lg:grid-cols-2 lg:items-center">
          <div>
            <h3 className="font-display text-4xl font-extrabold uppercase italic leading-tight text-white sm:text-5xl lg:text-6xl">
              Únete al <span className="text-accent underline decoration-white/10 underline-offset-8">Club</span>
            </h3>
            <p className="mt-6 max-w-md text-lg text-zinc-400">
              Recibe consejos de entrenamiento, preventas exclusivas y novedades de la comunidad Nova Forza.
            </p>
          </div>
          <div className="relative">
            <form className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="TU EMAIL"
                className="h-16 flex-1 bg-white/5 px-6 text-sm font-bold uppercase tracking-widest text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-accent"
                required
              />
              <Button type="submit" className="btn-athletic bg-accent !h-16 px-8 hover:bg-white hover:text-black">
                SUSCRIBIRME
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Al suscribirte, aceptas nuestra política de privacidad.
            </p>
          </div>
        </div>

        {/* Middle: Links Grid */}
        <div className="grid gap-16 lg:grid-cols-[1.5fr_1fr_1.5fr_1fr]">
          {/* Brand Col */}
          <div className="flex flex-col">
            <Link href="/" className="inline-block transition-transform hover:scale-105">
              <div className="relative h-12 w-48">
                <Image
                  src="/images/logo/logo-trans.webp"
                  alt={settings.site_name}
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="mt-8 max-w-xs text-sm leading-relaxed text-zinc-500">
              Nova Forza es resistencia física y mental en San Isidro. Un espacio diseñado para rendir mejor, sin ruidos, solo progreso.
            </p>
            <div className="mt-10 flex gap-4">
              {novaForzaHomeContent.socials.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex h-12 w-12 items-center justify-center border border-white/10 transition-all hover:bg-accent hover:border-accent"
                  aria-label={item.label}
                >
                  <span className="sr-only">{item.label}</span>
                  <div className="font-display text-xs font-bold uppercase tracking-widest text-zinc-500 transition-colors group-hover:text-white">
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Col */}
          <div>
            <h4 className="font-display text-lg font-bold uppercase italic tracking-widest text-white">
              Explorar
            </h4>
            <ul className="mt-8 space-y-4">
              {novaForzaHomeContent.navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group flex items-center text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-white"
                  >
                    <span className="mr-2 h-px w-0 bg-accent transition-all group-hover:w-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details Col */}
          <div>
            <h4 className="font-display text-lg font-bold uppercase italic tracking-widest text-white">
              Sede Principal
            </h4>
            <div className="mt-8 space-y-6">
              <div className="flex gap-4">
                <MapPin className="h-5 w-5 shrink-0 text-accent" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 leading-relaxed">
                  {novaForzaHomeContent.contact.address}
                </p>
              </div>
              <div className="flex gap-4">
                <Phone className="h-5 w-5 shrink-0 text-accent" />
                <Link href={whatsappHref} className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                  {novaForzaHomeContent.contact.whatsappDisplay}
                </Link>
              </div>
              <div className="flex gap-4">
                <Mail className="h-5 w-5 shrink-0 text-accent" />
                <Link href={`mailto:${contactEmail}`} className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                  {contactEmail}
                </Link>
              </div>
            </div>
          </div>

          {/* Legal / Secondary Col */}
          <div>
            <h4 className="font-display text-lg font-bold uppercase italic tracking-widest text-white">
              Soporte
            </h4>
            <ul className="mt-8 space-y-4">
              {legalLinks.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {novaForzaHomeContent.footerQuickLinks.filter(l => !legalLinks.some(ll => ll.label === l)).map((item) => (
                <li key={item}>
                  <Link
                    href="#contacto"
                    className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-white"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-32 border-t border-white/5 pt-10 text-center lg:flex lg:items-center lg:justify-between lg:text-left">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-700">
            &copy; {new Date().getFullYear()} NOVA FORZA GYM. PRECISIÓN Y PODER.
          </p>
          <div className="mt-6 flex justify-center gap-8 lg:mt-0 lg:justify-start">
             <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-800">DISEÑO PARA RENDIMIENTO</span>
             <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-800 tracking-tighter sm:tracking-[0.4em]">LIMA • PERÚ</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

