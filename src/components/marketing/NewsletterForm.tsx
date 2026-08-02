"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewsletterForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-4 sm:flex-row"
    >
      <input
        id="newsletter-email"
        name="newsletter-email"
        type="email"
        placeholder="TU EMAIL"
        autoComplete="email"
        className="h-16 w-full border border-white/10 bg-white/5 px-8 text-xs font-bold tracking-widest outline-none transition-all focus:border-primary/50 focus:bg-white/10 lg:w-80 rounded-[var(--radius-base)]"
        required
      />
      <Button type="submit" className="h-16 bg-white text-black hover:bg-primary hover:text-white px-10 rounded-[var(--radius-base)] font-black uppercase tracking-widest text-[10px]">
        Suscribirme
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
