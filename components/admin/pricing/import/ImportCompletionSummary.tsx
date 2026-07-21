"use client";

import { AdminButton, AdminInfoBanner } from "@/components/admin/ui";
import { ValidationMetricCards } from "./ValidationMetricCards";

type ImportCompletionSummaryProps = {
  batchId: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
  onImportAnother: () => void;
  onDownloadResults: () => void;
};

export function ImportCompletionSummary({
  batchId,
  created,
  updated,
  skipped,
  failed,
  errors,
  onImportAnother,
  onDownloadResults,
}: ImportCompletionSummaryProps) {
  const processed = created + updated + skipped + failed;
  return (
    <div className="admin-stack" style={{ display: "grid", gap: "1rem" }}>
      <div style={{ textAlign: "center" }}>
        <div className="imp-complete__icon" aria-hidden>
          ✓
        </div>
        <h2 style={{ margin: 0 }}>Import complete</h2>
        <p className="admin-help-text">
          {processed} rows processed · batch <code className="admin-code">{batchId}</code>
        </p>
      </div>

      <ValidationMetricCards
        active="all"
        onSelect={() => {}}
        metrics={[
          { filter: "all", label: "Created", value: created, tone: "success" },
          { filter: "all", label: "Updated", value: updated, tone: "info" },
          { filter: "all", label: "Skipped", value: skipped, tone: "muted" },
          { filter: "all", label: "Failed", value: failed, tone: failed ? "warning" : "muted" },
        ]}
      />

      <AdminInfoBanner tone="info">
        New and updated items are now available in Pricing and in <strong>Add from Inventory</strong>{" "}
        in the quote builder. Existing quote snapshots are unchanged.
      </AdminInfoBanner>

      {errors.length ? (
        <AdminInfoBanner tone="warning">
          {failed} row(s) were skipped or failed. Download the results for row-level detail.
        </AdminInfoBanner>
      ) : null}

      <div className="admin-panel__actions">
        <AdminButton href="/admin/pricing/materials/" variant="primary">
          View imported items
        </AdminButton>
        <AdminButton href="/admin/pricing/" variant="secondary">
          Open Pricing
        </AdminButton>
        <AdminButton type="button" variant="outline" onClick={onDownloadResults}>
          Download results
        </AdminButton>
        <AdminButton href="/admin/pricing/import/history/" variant="outline">
          Import history
        </AdminButton>
        <AdminButton type="button" variant="ghost" onClick={onImportAnother}>
          Import another CSV
        </AdminButton>
      </div>
    </div>
  );
}
