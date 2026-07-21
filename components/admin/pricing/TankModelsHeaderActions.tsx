"use client";

import { useTransition } from "react";
import { AdminActionMenu, AdminButton } from "@/components/admin/ui";
import { exportTankModelsCsvAction } from "@/app/admin/pricing/tank-models/import/tank-actions";

function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function TankModelsHeaderActions({
  canImport,
  canExportCosts,
}: {
  canImport: boolean;
  canExportCosts: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function exportCsv(mode: "full" | "sell") {
    startTransition(async () => {
      const res = await exportTankModelsCsvAction(mode);
      if (res.ok) downloadText(res.filename, res.csv);
    });
  }

  const items = [
    ...(canExportCosts
      ? [
          {
            id: "full",
            label: "Export full catalogue (with costs)",
            onSelect: () => exportCsv("full"),
          },
        ]
      : []),
    { id: "sell", label: "Export sell-price catalogue", onSelect: () => exportCsv("sell") },
    {
      id: "template",
      label: "Download CSV template",
      href: "/admin/pricing/tank-models/import/templates/damtech-tank-models-template.csv/",
    },
    { id: "history", label: "Import history", href: "/admin/pricing/tank-models/import/history/" },
  ];

  return (
    <>
      <AdminButton
        href="/admin/pricing/tank-models/import/templates/damtech-tank-models-template.csv/"
        variant="secondary"
      >
        Download template
      </AdminButton>
      <AdminActionMenu label={pending ? "Working…" : "More actions"} items={items} />
      {canImport ? (
        <AdminButton href="/admin/pricing/tank-models/import/" variant="primary">
          Import CSV
        </AdminButton>
      ) : null}
    </>
  );
}
