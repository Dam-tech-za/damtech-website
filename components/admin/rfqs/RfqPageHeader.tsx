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
      description="Every quote request and contact message from the website (RFQs). Open one to see the customer, site and request, then update its status as you follow up."
      secondaryActions={refreshSlot}
      secondaryAction={
        canExport
          ? { href: exportHref, label: "Export", variant: "secondary" }
          : undefined
      }
      primaryAction={
        canManage ? { href: "/quote/", label: "Add enquiry via website form" } : undefined
      }
    />
  );
}
