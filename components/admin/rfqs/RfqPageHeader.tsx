import type { ReactNode } from "react";
import { AdminPageHeader } from "@/components/admin/ui";

type RfqPageHeaderProps = {
  canExport: boolean;
  canManage: boolean;
  exportHref: string;
  refreshSlot?: ReactNode;
};

export function RfqPageHeader({
  canExport,
  canManage,
  exportHref,
  refreshSlot,
}: RfqPageHeaderProps) {
  return (
    <AdminPageHeader
      title="RFQs"
      description="Review incoming enquiries, contact customers and prepare requests for quotation."
      secondaryActions={refreshSlot}
      secondaryAction={
        canExport
          ? { href: exportHref, label: "Export", variant: "secondary" }
          : undefined
      }
      primaryAction={
        canManage ? { href: "/quote/", label: "Create RFQ" } : undefined
      }
    />
  );
}
