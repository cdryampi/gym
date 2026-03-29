import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import AdminSurface from "./AdminSurface";

const toneClasses = {
  default: "bg-[#fff5f5] text-[#d71920]",
  muted: "bg-[#f2efe8] text-[#5f6368]",
  success: "bg-[#eef9f1] text-[#237447]",
  warning: "bg-[#fff4e8] text-[#b86918]",
} as const;

interface AdminMetricCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: keyof typeof toneClasses;
}

export default function AdminMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: Readonly<AdminMetricCardProps>) {
  return (
    <AdminSurface className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#7a7f87]">
            {label}
          </p>
          <p className="text-4xl font-extrabold tracking-tighter text-[#111111] sm:text-[2.25rem]">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-none border border-black/6 shadow-[0_14px_36px_-24px_rgba(17,17,17,0.45)]",
            toneClasses[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 border-t border-black/8 pt-4">
        <p className="text-sm leading-6 text-[#4f5359]">{hint}</p>
      </div>
    </AdminSurface>
  );
}
