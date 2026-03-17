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
  return (
    <AdminSurface inset className="px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Badge variant={tone}>{tone === "warning" ? "Aviso" : tone === "success" ? "OK" : "Info"}</Badge>
        <p className="text-sm leading-6 text-[#4f5359]">{message}</p>
      </div>
    </AdminSurface>
  );
}
