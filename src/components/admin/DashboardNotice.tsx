import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import AdminSurface from "./AdminSurface";

interface DashboardNoticeProps {
  message: string;
  tone?: "warning" | "muted" | "success";
}

export default function DashboardNotice({
  message,
  tone = "warning",
}: Readonly<DashboardNoticeProps>) {
  const Icon = tone === "warning" ? AlertTriangle : tone === "success" ? CheckCircle2 : Info;

  return (
    <AdminSurface inset className="px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-none border border-black/8 bg-white text-[#5f6368]">
          <Icon className="h-4 w-4" />
        </div>
        <Badge variant={tone}>{tone === "warning" ? "Aviso" : tone === "success" ? "OK" : "Info"}</Badge>
        <p className="text-sm leading-6 text-[#4f5359]">{message}</p>
      </div>
    </AdminSurface>
  );
}
