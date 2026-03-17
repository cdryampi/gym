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
    <AdminSurface className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
            {label}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-[#111111]">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-none",
            toneClasses[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#5f6368]">{hint}</p>
    </AdminSurface>
  );
}
