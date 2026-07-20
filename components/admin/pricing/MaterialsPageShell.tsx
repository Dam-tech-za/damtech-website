"use client";

import { useState } from "react";
import { MaterialFormDrawer } from "@/components/admin/pricing/MaterialFormDrawer";
import { MaterialsPageClient } from "@/components/admin/pricing/MaterialsPageClient";

type MaterialsPageShellProps = {
  canManage: boolean;
  canSeeCost: boolean;
  initialQuery: string;
  initialCategory: string;
  initialActive: string;
  rows: Array<Record<string, unknown>>;
  errorMessage?: string;
  priceHistory?: import("@/components/admin/pricing/PriceHistory").PriceHistoryRow[];
};

export function MaterialsPageShell(props: MaterialsPageShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <MaterialsPageClient
        {...props}
        onAddMaterial={() => setDrawerOpen(true)}
      />
      {props.canManage ? (
        <MaterialFormDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          canSeeCost={props.canSeeCost}
        />
      ) : null}
    </>
  );
}
