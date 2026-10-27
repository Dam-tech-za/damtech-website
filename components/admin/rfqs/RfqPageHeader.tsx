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
      title="Enquiries"
      description="Quote requests and messages from the website. Open one to reply and move it along."
      secondaryActions={refreshSlot}
      secondaryAction={
        canExport
          ? { href: exportHref, label: "Export", variant: "secondary" }
          : undefined
      }
      primaryAction={
        canManage ? { href: "/quote/", label: "Log an enquiry" } : undefined
      }
    />
  );
}
