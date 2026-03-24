import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { CartProvider } from "@/components/cart/CartProvider";
import PublicPageShell from "@/components/marketing/PublicPageShell";
import { getCurrentMemberUser } from "@/lib/auth";
import { GYM_COOKIE_CONSENT } from "@/lib/cms/cookie-consent";
import { getCmsDocumentByKey, getFooterLegalLinks } from "@/lib/data/cms";
import { getMarketingData } from "@/lib/data/site";

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialConsent = cookieStore.get(GYM_COOKIE_CONSENT)?.value as "accepted" | "rejected" | undefined;

  const [{ settings }, currentUser, cookieDocument, legalLinks] = await Promise.all([
    getMarketingData(),
    getCurrentMemberUser(),
    getCmsDocumentByKey("system-cookie-banner"),
    getFooterLegalLinks(),
  ]);

  return (
    <CartProvider memberEmail={currentUser?.email ?? null}>
      <PublicPageShell
        settings={settings}
        currentUser={currentUser}
        cookieDocument={cookieDocument}
        legalLinks={legalLinks}
        initialConsent={initialConsent}
      >
        {children}
      </PublicPageShell>
    </CartProvider>
  );
}

