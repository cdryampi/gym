import Image from "next/image";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import CartEntry from "@/components/cart/CartEntry";
import { Button } from "@/components/ui/button";
import { novaForzaHomeContent } from "@/lib/data/nova-forza-content";
import type { SiteSettings } from "@/lib/supabase/database.types";

interface SiteHeaderProps {
  settings: SiteSettings;
  currentUser?: User | null;
}

export default function SiteHeader({ settings, currentUser = null }: Readonly<SiteHeaderProps>) {
  const primaryAction = currentUser
    ? { href: "/#contacto", label: settings.hero_primary_cta }
    : { href: "/registro", label: "Unirme" };
  const secondaryAction = currentUser
    ? { href: "/mi-cuenta", label: "Mi cuenta" }
    : { href: "/acceso", label: "Acceso" };

  return (
    <header className="border-b border-black/5 bg-[#f5f5f0] py-4 lg:py-6">
      <div className="section-shell flex items-center justify-between gap-8">
        <Link
          href="/"
          className="group relative flex shrink-0 items-center justify-center transition-transform hover:scale-105"
          aria-label={settings.site_name}
        >
          <div className="relative h-10 w-32 sm:h-12 sm:w-40">
            <Image
              src="/images/logo/logo-trans.webp"
              alt={settings.site_name}
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {novaForzaHomeContent.navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[11px] font-bold uppercase tracking-[0.3em] text-foreground transition-all hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <CartEntry />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden sm:size-default lg:inline-flex"
          >
            <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="btn-athletic btn-primary hidden sm:size-default lg:inline-flex"
          >
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
          </Button>

          <details className="relative lg:hidden">
            <summary className="flex h-12 w-12 list-none items-center justify-center bg-black/5 text-foreground [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Abrir menu</span>
              <div className="flex flex-col gap-1.5">
                <span className="h-0.5 w-6 rounded-none bg-foreground" />
                <span className="h-0.5 w-4 rounded-none bg-foreground" />
              </div>
            </summary>
            <div className="absolute right-0 top-14 z-20 w-[min(20rem,calc(100vw-2rem))] animate-in fade-in slide-in-from-top-2 border border-black/8 bg-[#f5f5f0] p-4 shadow-xl duration-200">
              <nav className="flex flex-col">
                {novaForzaHomeContent.navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="border-b border-black/6 px-2 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground last:border-b-0"
                  >
                    {item.label}
                  </Link>
                ))}
                
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-black/8 pt-4">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                  </Button>
                  <Button asChild size="sm" className="btn-athletic btn-primary w-full">
                    <Link href={primaryAction.href}>{primaryAction.label}</Link>
                  </Button>
                </div>
                <div className="mt-2 border-t border-black/8 pt-4">
                  <Link
                    href="/carrito"
                    className="block border border-black/12 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#111111] transition hover:border-[#d71920]/35 hover:bg-[#fff7f7]"
                  >
                    Ver carrito
                  </Link>
                </div>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
