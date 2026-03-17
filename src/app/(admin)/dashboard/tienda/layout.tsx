import type { ReactNode } from "react";

import StoreDashboardNav from "@/components/admin/StoreDashboardNav";

export default function DashboardStoreLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="space-y-5">
      <StoreDashboardNav />
      {children}
    </div>
  );
}
