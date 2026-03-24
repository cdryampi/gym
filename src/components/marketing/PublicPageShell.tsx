import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";

import CookieConsentBanner from "@/components/marketing/CookieConsentBanner";
import SiteFooter from "@/components/marketing/SiteFooter";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteTopbar from "@/components/marketing/SiteTopbar";
import { cn } from "@/lib/utils";
import type { DBCmsDocument, SiteSettings } from "@/lib/supabase/database.types";

interface PublicPageShellProps {
  children: ReactNode;
  settings: SiteSettings;
  cookieDocument: DBCmsDocument;
  legalLinks: Array<{
    key: string;
    href: string;
    label: string;
  }>;
  currentUser?: User | null;
  initialConsent?: "accepted" | "rejected";
  className?: string;
  mainClassName?: string;
}

export default function PublicPageShell({
  children,
  settings,
  cookieDocument,
  legalLinks,
  currentUser = null,
  initialConsent,
  className,
  mainClassName,
}: Readonly<PublicPageShellProps>) {
  return (
    <div className={cn("min-h-screen bg-[#f7f4ef]", className)}>
      <div className="sticky top-0 z-50">
        <SiteTopbar settings={settings} />
        <SiteHeader settings={settings} currentUser={currentUser} />
      </div>
      <main className={mainClassName}>{children}</main>
      <SiteFooter settings={settings} legalLinks={legalLinks} />
      <CookieConsentBanner document={cookieDocument} initialConsent={initialConsent} />
    </div>
  );
}
