"use client";

import type { SiteSettings } from "@/lib/supabase/database.types";

interface FloatingWhatsAppButtonProps {
  settings: SiteSettings;
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
    >
      <path d="M19.05 4.93A9.9 9.9 0 0 0 12.02 2C6.55 2 2.1 6.45 2.1 11.93c0 1.75.46 3.46 1.33 4.97L2 22l5.25-1.38a9.9 9.9 0 0 0 4.75 1.21h.01c5.47 0 9.92-4.45 9.92-9.93a9.85 9.85 0 0 0-2.88-6.97ZM12 20.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.85 2.42 8.16 8.16 0 0 1 2.4 5.82c0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.15c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.57.13-.17.25-.65.8-.8.97-.15.17-.3.19-.55.06-.25-.12-1.06-.39-2.01-1.24-.74-.66-1.23-1.48-1.38-1.73-.14-.25-.02-.38.1-.5.11-.11.25-.3.37-.45.12-.14.16-.25.25-.42.08-.17.04-.32-.02-.45-.06-.12-.57-1.37-.78-1.88-.21-.5-.42-.43-.57-.44h-.48c-.17 0-.45.06-.69.32-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.02 2.6.13.16 1.77 2.7 4.28 3.79.6.26 1.07.41 1.44.52.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  );
}

export default function FloatingWhatsAppButton({
  settings,
}: Readonly<FloatingWhatsAppButtonProps>) {
  const whatsappUrl = settings.whatsapp_url?.trim();

  if (!whatsappUrl) {
    return null;
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribenos por WhatsApp"
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] right-4 z-40 inline-flex items-center gap-3 rounded-full border border-[#25d366]/30 bg-[#111111]/92 px-4 py-3 text-white shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-[#25d366]/60 hover:bg-[#1a1a1a] hover:shadow-[0_22px_50px_rgba(0,0,0,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25d366] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151518] md:bottom-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] md:right-6 md:px-5"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25d366] text-[#111111] shadow-[0_10px_24px_rgba(37,211,102,0.35)]">
        <WhatsAppIcon />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
          Contacto directo
        </span>
        <span className="text-sm font-black">WhatsApp</span>
      </span>
    </a>
  );
}
