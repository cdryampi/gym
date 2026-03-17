import type { ReactNode } from "react";

import PublicPageShell from "@/components/marketing/PublicPageShell";
import { getCurrentMemberUser } from "@/lib/auth";
import { getMarketingData } from "@/lib/data/site";

export default async function ShopLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [{ settings }, currentUser] = await Promise.all([getMarketingData(), getCurrentMemberUser()]);

  return (
    <PublicPageShell settings={settings} currentUser={currentUser}>
      {children}
    </PublicPageShell>
  );
}
