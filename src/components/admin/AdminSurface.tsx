import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AdminSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  inset?: boolean;
}

export default function AdminSurface({
  children,
  className,
  inset = false,
  ...props
}: Readonly<AdminSurfaceProps>) {
  return (
    <div
      className={cn(
        "rounded-none border border-black/8 bg-white shadow-[0_24px_70px_-48px_rgba(17,17,17,0.3)]",
        inset && "border-black/6 bg-[#fbfbf8] shadow-none",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
