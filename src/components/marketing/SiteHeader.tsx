import Image from "next/image";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { novaForzaHomeContent } from "@/lib/data/nova-forza-content";
import type { SiteSettings } from "@/lib/supabase/database.types";

interface SiteHeaderProps {
  settings: SiteSettings;
  currentUser?: User | null;
}

export default function SiteHeader({ settings, currentUser = null }: Readonly<SiteHeaderProps>) {
  return (
    <header className="border-b border-black/5 bg-[#f5f5f0] py-4 lg:py-6">
      <div className="section-shell flex items-center justify-between gap-8">
        <Link href="/" className="group relative flex shrink-0 items-center justify-center transition-transform hover:scale-105" aria-label={settings.site_name}>
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
          {currentUser ? (
            <>
              <Button asChild variant="outline" className="hidden h-10 px-4 text-[10px] sm:flex sm:h-12 sm:px-6 sm:text-xs">
                <Link href="/mi-cuenta">Mi cuenta</Link>
              </Button>
              <Button asChild className="btn-athletic btn-primary !h-10 !px-6 !text-[10px] sm:!h-12 sm:!px-8 sm:!text-xs">
                <Link href="/#contacto">{settings.hero_primary_cta}</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" className="hidden h-10 px-4 text-[10px] sm:flex sm:h-12 sm:px-6 sm:text-xs">
                <Link href="/acceso">Acceso</Link>
              </Button>
              <Button asChild className="btn-athletic btn-primary !h-10 !px-6 !text-[10px] sm:!h-12 sm:!px-8 sm:!text-xs">
                <Link href="/registro">Unirme</Link>
              </Button>
            </>
          )}
          <button className="flex h-12 w-12 items-center justify-center bg-black/5 text-foreground lg:hidden">
            <span className="sr-only">Menu</span>
            <div className="flex flex-col gap-1.5">
              <span className="h-0.5 w-6 rounded-none bg-foreground" />
              <span className="h-0.5 w-4 rounded-none bg-foreground" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
