import { FileSpreadsheet } from "lucide-react";

import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import MemberImportPanel from "@/components/admin/MemberImportPanel";

export default function DashboardMemberImportPage() {
  return (
    <div className="space-y-10">
      <DashboardPageHeader
        title="IMPORTAR SOCIOS"
        description="Migracion controlada desde CSV o XLSX con previsualizacion, semaforo y confirmacion manual."
        icon={FileSpreadsheet}
        eyebrow="Operaciones Gym"
      />

      <MemberImportPanel />
    </div>
  );
}
