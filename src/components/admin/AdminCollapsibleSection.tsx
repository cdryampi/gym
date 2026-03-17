"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import AdminSurface from "./AdminSurface";

interface AdminCollapsibleSectionProps {
  title: string;
  description: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function AdminCollapsibleSection({
  title,
  description,
  children,
  defaultOpen = false,
}: Readonly<AdminCollapsibleSectionProps>) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <AdminSurface inset className="overflow-hidden">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#111111]">{title}</h3>
          <p className="text-sm leading-6 text-[#5f6368]">{description}</p>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-[#7a7f87] transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen ? <div className="border-t border-black/6 px-5 py-5">{children}</div> : null}
    </AdminSurface>
  );
}
