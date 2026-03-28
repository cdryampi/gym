import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import AdminSurface from "./AdminSurface";

interface AdminSectionProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function AdminSection({
  title,
  description,
  badge,
  icon: Icon,
  children,
  className,
  contentClassName,
}: Readonly<AdminSectionProps>) {
  return (
    <AdminSurface className={cn("p-6 sm:p-7", className)}>
      <div className="flex flex-col gap-3 border-b border-black/8 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {Icon ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-[#d71920]/10 bg-[#fff5f5] text-[#d71920]">
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-[#111111]">{title}</h2>
              {description ? (
                <p className="max-w-3xl text-sm leading-7 text-[#4f5359]">{description}</p>
              ) : null}
            </div>
          </div>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      <div className={cn("pt-5", contentClassName)}>{children}</div>
    </AdminSurface>
  );
}
