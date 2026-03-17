import { Badge } from "@/components/ui/badge";
import { getLeadStatusMeta } from "@/lib/admin-dashboard";
import type { LeadStatus } from "@/lib/supabase/database.types";

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

export default function LeadStatusBadge({ status }: Readonly<LeadStatusBadgeProps>) {
  const meta = getLeadStatusMeta(status);

  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}
