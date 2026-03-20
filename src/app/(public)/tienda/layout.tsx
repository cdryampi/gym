import type { ReactNode } from "react";

import PublicPageShell from "@/components/marketing/PublicPageShell";
import { getMarketingData } from "@/lib/data/site";

export default async function ShopLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { settings } = await getMarketingData();

  return (
    <PublicPageShell settings={settings}>
      {children}
    </PublicPageShell>
  );
}
