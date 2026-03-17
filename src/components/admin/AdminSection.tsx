import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import AdminSurface from "./AdminSurface";

interface AdminSectionProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function AdminSection({
  title,
  description,
  badge,
  children,
  className,
  contentClassName,
}: Readonly<AdminSectionProps>) {
  return (
    <AdminSurface className={cn("p-6 sm:p-7", className)}>
      <div className="flex flex-col gap-3 border-b border-black/8 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-[#111111]">{title}</h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-7 text-[#5f6368]">{description}</p>
          ) : null}
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      <div className={cn("pt-5", contentClassName)}>{children}</div>
    </AdminSurface>
  );
}
