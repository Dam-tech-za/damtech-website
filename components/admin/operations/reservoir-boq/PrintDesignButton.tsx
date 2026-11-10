"use client";

import { AdminButton } from "@/components/admin/ui";

/** Opens the browser's print dialog; the print stylesheet lays the design out on A4, so "Save as PDF" gives the PDF. */
export function PrintDesignButton() {
  return (
    <AdminButton variant="primary" onClick={() => window.print()}>
      Print Design
    </AdminButton>
  );
}
