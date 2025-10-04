import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "pending" | "approved" | "rejected" | "draft";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "badge-pending",
  },
  approved: {
    label: "Approved",
    className: "badge-approved",
  },
  rejected: {
    label: "Rejected",
    className: "badge-rejected",
  },
  draft: {
    label: "Draft",
    className: "badge-draft",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
