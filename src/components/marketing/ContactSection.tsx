import { Mail, MapPin, Smartphone } from "lucide-react";

import { novaForzaHomeContent } from "@/lib/data/nova-forza-content";
import type { SiteSettings } from "@/lib/supabase/database.types";
import LeadForm from "./LeadForm";

export default function ContactSection({ settings }: { settings: SiteSettings }) {
  return (
    <section id="contacto" className="section-anchor relative overflow-hidden bg-[#f5f5f0] py-24 md:py-32">
      <div className="section-shell grid gap-16 lg:grid-cols-2">
        <div className="max-w-xl">
          <p className="section-kicker">Comienza hoy</p>
          <h2 className="section-title italic">
            Ubicación & <span className="text-accent underline decoration-accent/20 underline-offset-8">Contacto</span>
          </h2>

          <div className="mt-16 space-y-12">
            <div className="flex items-start gap-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-black text-accent">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/40">Dirección</p>
                <p className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-foreground">
                  {settings.address ?? novaForzaHomeContent.contact.address}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-black text-accent">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/40">
                  {novaForzaHomeContent.contact.whatsappLabel}
                </p>
                <p className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-foreground">
                  {settings.contact_phone ?? novaForzaHomeContent.contact.whatsappDisplay}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-black text-accent">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/40">
                  {novaForzaHomeContent.contact.emailLabel}
                </p>
                <p className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-foreground">
                  {settings.contact_email}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-8 -top-8 -z-10 h-64 w-64 bg-accent/5 blur-3xl" />
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
