"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  AdminActionMenu,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminInfoBanner,
  AdminCheckbox,
} from "@/components/admin/ui";
import type { CanonicalHeader } from "@/lib/pricing/csv/columns";
import type { RowValidationResult } from "@/lib/pricing/csv/validate";
import {
  previewInventoryImportAction,
  commitInventoryImportAction,
  exportInventoryCsvAction,
  revalidateRowsAction,
  type PreviewInventoryImportResult,
} from "@/app/admin/pricing/import/inventory-actions";
import { AdminDialog } from "@/components/admin/ui/AdminDialog";
import { ImportStepper } from "./import/ImportStepper";
import { CsvDropzone, type SelectedFileMeta } from "./import/CsvDropzone";
import {
  ImportAnalysisProgress,
  ImportAnalysisSummary,
} from "./import/ImportAnalysisSummary";
import { FieldMatchSummary } from "./import/FieldMatchSummary";
import { ColumnMappingDrawer } from "./import/ColumnMappingDrawer";
import { ValidationMetricCards } from "./import/ValidationMetricCards";
import { ValidationIssueList, type ImportIssue } from "./import/ValidationIssueList";
import { ImportPreviewTable } from "./import/ImportPreviewTable";
import { ImportRowDrawer, type RowEdits } from "./import/ImportRowDrawer";
import { ImportSettingsPanel } from "./import/ImportSettingsPanel";
import { ImportStickyActionBar } from "./import/ImportStickyActionBar";
import { ImportProgressPanel } from "./import/ImportProgressPanel";
import { ImportCompletionSummary } from "./import/ImportCompletionSummary";
import {
  DEFAULT_IMPORT_SETTINGS,
  type ImportSettings,
  type ImportStepId,
  type PreviewFilter,
} from "./import/types";

type InventoryImportWizardProps = {
  canImport: boolean;
  canExportCosts: boolean;
};

type PreviewOk = Extract<PreviewInventoryImportResult, { ok: true }>;

function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function computeSummary(rows: RowValidationResult[]) {
  return {
    total: rows.length,
    ready: rows.filter((r) => r.status === "ready").length,
    warnings: rows.filter(
      (r) =>
        r.status === "ready_with_warning" ||
        r.status === "manual_confirmation" ||
        r.status === "missing_price",
    ).length,
    invalid: rows.filter((r) => r.status === "invalid").length,
    duplicates: rows.filter((r) => r.status === "duplicate").length,
    manual: rows.filter(
      (r) => r.status === "manual_confirmation" || r.status === "missing_price",
    ).length,
    zeroPrice: rows.filter(
      (r) =>
        r.data &&
        (r.data.recommended_sell_ex_vat_zar == null ||
          r.data.recommended_sell_ex_vat_zar === 0),
    ).length,
    included: rows.filter((r) => !r.excluded && r.status !== "invalid").length,
  };
}

function deriveIssues(rows: RowValidationResult[]): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const invalid = rows.filter((r) => r.status === "invalid").length;
  const duplicates = rows.filter((r) => r.status === "duplicate").length;
  const zeroPrice = rows.filter(
    (r) =>
      r.data &&
      (r.data.recommended_sell_ex_vat_zar == null ||
        r.data.recommended_sell_ex_vat_zar === 0),
  ).length;
  const missingTechnical = rows.filter((r) =>
    r.warnings.some((w) => /thickness|gsm/i.test(w)),
  ).length;

  if (invalid) {
    issues.push({
      id: "invalid",
      group: "Invalid rows",
      severity: "error",
      count: invalid,
      description: "Rows with errors that must be corrected or excluded before import.",
      filter: "invalid",
    });
  }
  if (duplicates) {
    issues.push({
      id: "duplicates",
      group: "Duplicates",
      severity: "info",
      count: duplicates,
      description: "Item codes that already exist in the catalogue.",
      filter: "duplicates",
    });
  }
  if (zeroPrice) {
    issues.push({
      id: "pricing",
      group: "Pricing",
      severity: "warning",
      count: zeroPrice,
      description: "Items with zero or missing selling prices require confirmation.",
      filter: "manual",
    });
  }
  if (missingTechnical) {
    issues.push({
      id: "technical",
      group: "Technical data",
      severity: "info",
      count: missingTechnical,
      description: "Items missing thickness or GSM for their category.",
      filter: "warnings",
    });
  }
  return issues;
}

export function InventoryImportWizard({ canImport, canExportCosts }: InventoryImportWizardProps) {
  const [step, setStep] = useState<ImportStepId>("upload");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [filename, setFilename] = useState("inventory.csv");
  const [mimeType, setMimeType] = useState("text/csv");
  const [csvText, setCsvText] = useState("");
  const [fileMeta, setFileMeta] = useState<SelectedFileMeta | null>(null);
  const [preview, setPreview] = useState<PreviewOk | null>(null);
  const [mapping, setMapping] = useState<Record<string, CanonicalHeader | "">>({});
  const [rows, setRows] = useState<RowValidationResult[]>([]);
  const [settings, setSettings] = useState<ImportSettings>(DEFAULT_IMPORT_SETTINGS);
  const [filter, setFilter] = useState<PreviewFilter>("all");
  const [search, setSearch] = useState("");
  const [mappingOpen, setMappingOpen] = useState(false);
  const [rowDrawer, setRowDrawer] = useState<number | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [importStage, setImportStage] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ackHistory, setAckHistory] = useState(false);
  const [result, setResult] = useState<{
    batchId: string;
    successCount: number;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    failureCount: number;
    warningCount: number;
    errors: string[];
  } | null>(null);

  const analysisTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!analysing) return;
    analysisTimer.current = setInterval(() => {
      setAnalysisStep((s) => (s < 3 ? s + 1 : s));
    }, 220);
    return () => {
      if (analysisTimer.current) clearInterval(analysisTimer.current);
    };
  }, [analysing]);

  const summary = useMemo(() => computeSummary(rows), [rows]);
  const issues = useMemo(() => deriveIssues(rows), [rows]);
  const activeRow = useMemo(
    () => rows.find((r) => r.rowNumber === rowDrawer) ?? null,
    [rows, rowDrawer],
  );

  const mappingBlocked =
    (preview?.autoMap.missingRequired.length ?? 0) > 0 ||
    (preview?.autoMap.conflicts.length ?? 0) > 0;

  function analyse(nextCsv: string, name: string, mime: string, override?: Record<string, CanonicalHeader | "">) {
    setAnalysing(true);
    setAnalysisStep(0);
    startTransition(async () => {
      const res = await previewInventoryImportAction({
        filename: name,
        mimeType: mime,
        csvText: nextCsv,
        mapping: override,
        byteLength: new TextEncoder().encode(nextCsv).length,
      });
      setAnalysing(false);
      if (!res.ok) {
        setMessage(res.error);
        setFileMeta(null);
        return;
      }
      setPreview(res);
      setMapping(res.mapping);
      setRows(res.rows);
      setMessage(null);
      setFileMeta({
        name,
        sizeBytes: new TextEncoder().encode(nextCsv).length,
        rows: res.summary.rowsFound,
        columns: res.headers.length,
        encoding: res.hadBom ? "UTF-8 (BOM)" : "UTF-8",
        templateLabel: res.template.label,
        templateConfidence: res.template.confidence,
      });
      // Canonical CSVs auto-advance to preview; only stop at the mapping review
      // step when the engine flags unresolved fields.
      setStep(res.autoMap.requiresAttention ? "review" : "preview");
    });
  }

  function onSelectFile(file: File) {
    setFilename(file.name);
    setMimeType(file.type || "text/csv");
    setResult(null);
    void file.text().then((text) => {
      setCsvText(text);
      analyse(text, file.name, file.type || "text/csv");
    });
  }

  function removeFile() {
    setFileMeta(null);
    setPreview(null);
    setRows([]);
    setCsvText("");
    setStep("upload");
  }

  function applyMapping(next: Record<string, CanonicalHeader | "">) {
    setMappingOpen(false);
    setMapping(next);
    analyse(csvText, filename, mimeType, next);
  }

  function acceptSuggestion(header: string, target: CanonicalHeader) {
    const next = { ...mapping, [header]: target };
    setMapping(next);
    analyse(csvText, filename, mimeType, next);
  }

  function ignoreColumn(header: string) {
    const next = { ...mapping, [header]: "" as const };
    setMapping(next);
    analyse(csvText, filename, mimeType, next);
  }

  function toggleRow(rowNumber: number, included: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.rowNumber === rowNumber ? { ...r, excluded: !included } : r)),
    );
  }

  function saveRow(rowNumber: number, edits: RowEdits) {
    const target = rows.find((r) => r.rowNumber === rowNumber);
    if (!target) return;
    const mergedRaw: Record<string, string> = { ...target.raw };
    for (const [key, value] of Object.entries(edits)) {
      if (value !== undefined) mergedRaw[key] = value;
    }
    startTransition(async () => {
      const res = await revalidateRowsAction({ rows: [{ rowNumber, raw: mergedRaw }] });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      const updated = res.rows[0];
      if (updated) {
        setRows((prev) =>
          prev.map((r) =>
            r.rowNumber === rowNumber ? { ...updated, excluded: r.excluded } : r,
          ),
        );
      }
      setRowDrawer(null);
    });
  }

  function runImport() {
    setConfirmOpen(false);
    setStep("import");
    setImportStage(0);
    const stageTimer = setInterval(() => setImportStage((s) => (s < 4 ? s + 1 : s)), 300);

    // Apply manual-confirmation setting to selected rows.
    const prepared = rows.map((r) => {
      if (!r.data) return r;
      const isManual = r.status === "manual_confirmation" || r.status === "missing_price";
      if (!isManual) return r;
      if (settings.manualConfirmation === "exclude") return { ...r, excluded: true };
      if (settings.manualConfirmation === "inactive") {
        return { ...r, data: { ...r.data, is_active: false } };
      }
      return r;
    });

    startTransition(async () => {
      const res = await commitInventoryImportAction({
        filename,
        csvText,
        fileHash: preview?.fileHash ?? "",
        rows: prepared,
        duplicateMode: settings.duplicateMode,
        importMode: settings.importMode,
        makePreferred: settings.newPrices === "current",
        templateType: preview?.template.template ?? null,
        mappingSnapshot: mapping,
        validationSummary: {
          rowsFound: summary.total,
          validRows: summary.ready,
          warningRows: summary.warnings,
          invalidRows: summary.invalid,
          duplicates: summary.duplicates,
        },
      });
      clearInterval(stageTimer);
      if (!res.ok) {
        setMessage(res.error);
        setStep("preview");
        return;
      }
      setResult(res);
      setStep("complete");
    });
  }

  function exportCsv(mode: "full" | "sell") {
    startTransition(async () => {
      const res = await exportInventoryCsvAction(mode);
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      downloadText(res.filename, res.csv);
    });
  }

  function downloadResults() {
    const lines = [
      "row,item_code,status,detail",
      ...rows.map((r) =>
        [
          r.rowNumber,
          r.data?.item_code ?? r.raw.item_code ?? "",
          r.status,
          JSON.stringify(r.errors[0] ?? r.warnings[0] ?? ""),
        ].join(","),
      ),
    ];
    downloadText("import-results.csv", lines.join("\n"));
  }

  const exportItems = [
    ...(canExportCosts
      ? [{ id: "full", label: "Export full inventory (with costs)", onSelect: () => exportCsv("full") }]
      : []),
    { id: "sell", label: "Export sell-price catalogue", onSelect: () => exportCsv("sell") },
    {
      id: "template",
      label: "Download starter CSV",
      href: "/admin/pricing/import/templates/damtech_inventory_import_starter.csv",
    },
    { id: "pricing", label: "View pricing catalogue", href: "/admin/pricing/" },
  ];

  const importableCount = summary.included;
  const stepperError: ImportStepId | null =
    step === "preview" && summary.invalid > 0 && settings.importMode === "all_or_nothing"
      ? "preview"
      : null;

  if (!canImport) {
    return (
      <AdminEmptyState
        title="Import requires pricing management permission."
        description="Owner, admin or estimator roles can import inventory CSVs."
      />
    );
  }

  return (
    <div className="imp-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <ImportStepper current={step} errorStep={stepperError} />
        <AdminActionMenu label="Export & tools" items={exportItems} />
      </div>

      {/* Compact help */}
      <details className="admin-ui-card" style={{ padding: "0.85rem 1.1rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Need help preparing your CSV?
        </summary>
        <div style={{ marginTop: "0.6rem", display: "grid", gap: "0.5rem" }}>
          <p className="admin-help-text">
            Download the template or view the guide. Costs and sell prices are ex VAT; price changes
            create history versions.
          </p>
          <div className="admin-panel__actions">
            <AdminButton
              href="/admin/pricing/import/templates/damtech-inventory-import-template.csv"
              size="sm"
              variant="secondary"
            >
              Download template
            </AdminButton>
            <AdminButton
              href="/admin/pricing/import/templates/damtech-inventory-import-guide.md"
              size="sm"
              variant="ghost"
            >
              View guide
            </AdminButton>
          </div>
        </div>
      </details>

      {/* Step 1: Upload */}
      {step === "upload" ? (
        <AdminCard>
          <CsvDropzone file={fileMeta} disabled={pending} onSelect={onSelectFile} onRemove={removeFile} />
          {analysing ? (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Analysing file</p>
              <ImportAnalysisProgress activeIndex={analysisStep} />
            </div>
          ) : null}
        </AdminCard>
      ) : null}

      {/* Step 2: Review */}
      {step === "review" && preview ? (
        <>
          <AdminCard>
            <CsvDropzone file={fileMeta} disabled={pending} onSelect={onSelectFile} onRemove={removeFile} />
            <div style={{ marginTop: "1rem" }}>
              <ImportAnalysisSummary
                template={preview.template}
                autoMap={preview.autoMap}
                rowsFound={preview.summary.rowsFound}
              />
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="admin-panel__title" style={{ marginBottom: "0.75rem" }}>
              Field matching
            </h2>
            <FieldMatchSummary
              autoMap={preview.autoMap}
              mapping={mapping}
              onReviewMapping={() => setMappingOpen(true)}
              onAccept={acceptSuggestion}
              onIgnore={ignoreColumn}
            />
          </AdminCard>

          {preview.autoMap.requiresAttention ? null : (
            <AdminInfoBanner tone="info">
              All required fields matched automatically. Continue to preview and validation.
            </AdminInfoBanner>
          )}
        </>
      ) : null}

      {/* Step 3: Preview */}
      {step === "preview" && preview ? (
        <>
          <AdminInfoBanner tone="info">
            <strong>{preview.template.label}</strong> recognised ·{" "}
            {preview.autoMap.autoAcceptedCount} of {preview.autoMap.matches.length} columns matched
            automatically.{" "}
            <AdminButton type="button" variant="link" size="sm" onClick={() => setMappingOpen(true)}>
              Review mapping
            </AdminButton>
          </AdminInfoBanner>
          <AdminCard>
            <h2 className="admin-panel__title" style={{ marginBottom: "0.75rem" }}>
              Validation summary
            </h2>
            <ValidationMetricCards
              active={filter}
              onSelect={setFilter}
              metrics={[
                { filter: "all", label: "Total rows", value: summary.total },
                { filter: "ready", label: "Ready", value: summary.ready, tone: "success" },
                { filter: "warnings", label: "Warnings", value: summary.warnings, tone: "warning" },
                { filter: "invalid", label: "Invalid", value: summary.invalid, tone: summary.invalid ? "warning" : "muted" },
                { filter: "duplicates", label: "Duplicates", value: summary.duplicates, tone: "info" },
              ]}
            />
            {issues.length ? (
              <div style={{ marginTop: "1rem" }}>
                <ValidationIssueList issues={issues} onViewRows={setFilter} />
              </div>
            ) : null}
          </AdminCard>

          <AdminCard>
            <h2 className="admin-panel__title" style={{ marginBottom: "0.75rem" }}>
              Import settings
            </h2>
            <ImportSettingsPanel settings={settings} onChange={setSettings} />
          </AdminCard>

          <AdminCard>
            <ImportPreviewTable
              rows={rows}
              canSeeCost={canExportCosts}
              filter={filter}
              onFilterChange={setFilter}
              search={search}
              onSearchChange={setSearch}
              onToggleRow={toggleRow}
              onOpenRow={setRowDrawer}
            />
          </AdminCard>
        </>
      ) : null}

      {/* Step 4: Import progress */}
      {step === "import" ? (
        <AdminCard>
          <ImportProgressPanel activeIndex={importStage} />
        </AdminCard>
      ) : null}

      {/* Step 5: Complete */}
      {step === "complete" && result ? (
        <AdminCard>
          <ImportCompletionSummary
            batchId={result.batchId}
            created={result.createdCount}
            updated={result.updatedCount}
            skipped={result.skippedCount}
            failed={result.failureCount}
            errors={result.errors}
            onImportAnother={() => {
              removeFile();
              setResult(null);
            }}
            onDownloadResults={downloadResults}
          />
        </AdminCard>
      ) : null}

      {message ? <AdminInfoBanner tone="warning">{message}</AdminInfoBanner> : null}

      {/* Drawers */}
      {preview ? (
        <ColumnMappingDrawer
          open={mappingOpen}
          autoMap={preview.autoMap}
          mapping={mapping}
          onClose={() => setMappingOpen(false)}
          onApply={applyMapping}
        />
      ) : null}

      <ImportRowDrawer
        open={rowDrawer !== null}
        row={activeRow}
        canSeeCost={canExportCosts}
        onClose={() => setRowDrawer(null)}
        onSave={saveRow}
        onDuplicateModeChange={(_, mode) => setSettings((prev) => ({ ...prev, duplicateMode: mode }))}
        duplicateMode={settings.duplicateMode}
      />

      {/* Confirmation dialog */}
      <AdminDialog
        open={confirmOpen}
        title="Confirm import"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton variant="primary" disabled={!ackHistory} onClick={runImport}>
              Confirm import
            </AdminButton>
          </>
        }
      >
        <ul className="admin-list">
          <li>{importableCount} items will be imported</li>
          <li>{summary.duplicates} existing item(s) handled as “{settings.duplicateMode.replaceAll("_", " ")}”</li>
          <li>{summary.invalid} invalid row(s) excluded</li>
        </ul>
        <AdminCheckbox
          label="I understand that price changes create new history versions."
          checked={ackHistory}
          onChange={(e) => setAckHistory(e.target.checked)}
        />
      </AdminDialog>

      {/* Sticky action bar */}
      {step === "review" ? (
        <ImportStickyActionBar
          selected={summary.total}
          ready={summary.ready}
          warnings={summary.warnings}
          invalidExcluded={summary.invalid}
          primaryLabel={mappingBlocked ? "Resolve mapping" : "Continue to preview"}
          primaryDisabled={mappingBlocked}
          onPrimary={() => (mappingBlocked ? setMappingOpen(true) : setStep("preview"))}
          onBack={() => setStep("upload")}
        />
      ) : null}

      {step === "preview" ? (
        <ImportStickyActionBar
          selected={summary.included}
          ready={summary.ready}
          warnings={summary.warnings}
          invalidExcluded={summary.invalid}
          primaryLabel={
            summary.invalid > 0 && settings.importMode === "all_or_nothing"
              ? `Review ${summary.invalid} errors`
              : `Import ${importableCount} items`
          }
          primaryDisabled={
            importableCount === 0 ||
            (summary.invalid > 0 && settings.importMode === "all_or_nothing")
          }
          onPrimary={() => {
            if (summary.invalid > 0 && settings.importMode === "all_or_nothing") {
              setFilter("invalid");
              return;
            }
            setAckHistory(false);
            setConfirmOpen(true);
          }}
          onBack={() => setStep("review")}
        />
      ) : null}
    </div>
  );
}
