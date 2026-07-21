"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  AdminActionMenu,
  AdminButton,
  AdminCard,
  AdminCheckbox,
  AdminDialog,
  AdminEmptyState,
  AdminField,
  AdminInfoBanner,
  AdminSelect,
} from "@/components/admin/ui";
import type { DuplicateMode, ImportMode } from "@/lib/pricing/csv/commit";
import {
  TANK_CANONICAL_HEADERS,
  type TankCanonicalHeader,
} from "@/lib/pricing/tank-import/columns";
import type { TankRowValidationResult } from "@/lib/pricing/tank-import/validate";
import {
  previewTankImportAction,
  commitTankImportAction,
  exportTankModelsCsvAction,
  type PreviewTankImportResult,
} from "@/app/admin/pricing/tank-models/import/tank-actions";
import { ImportStepper } from "./import/ImportStepper";
import { CsvDropzone, type SelectedFileMeta } from "./import/CsvDropzone";
import { ImportAnalysisProgress } from "./import/ImportAnalysisSummary";
import { ValidationMetricCards } from "./import/ValidationMetricCards";
import { ImportStickyActionBar } from "./import/ImportStickyActionBar";
import { ImportProgressPanel } from "./import/ImportProgressPanel";
import {
  TankImportPreviewTable,
  type TankPreviewFilter,
} from "./import/TankImportPreviewTable";
import type { ImportStepId, PreviewFilter } from "./import/types";

type TankImportWizardProps = {
  canImport: boolean;
  canExportCosts: boolean;
};

type PreviewOk = Extract<PreviewTankImportResult, { ok: true }>;

const DUPLICATE_MODES: Array<{ value: DuplicateMode; label: string }> = [
  { value: "skip", label: "Skip existing models" },
  { value: "update_fields", label: "Update non-price fields" },
  { value: "add_price", label: "Add new price version" },
  { value: "reactivate", label: "Reactivate archived model" },
  { value: "create_new", label: "Create as new model (versioned code)" },
];

function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function computeSummary(rows: TankRowValidationResult[]) {
  return {
    total: rows.length,
    ready: rows.filter((r) => r.status === "ready").length,
    warnings: rows.filter((r) => r.status === "ready_with_warning").length,
    invalid: rows.filter((r) => r.status === "invalid").length,
    duplicates: rows.filter((r) => r.status === "duplicate").length,
    manual: rows.filter((r) => r.status === "manual_confirmation").length,
    missingLiner: rows.filter((r) => r.warnings.some((w) => w.includes("PVC liner price required")))
      .length,
    included: rows.filter((r) => !r.excluded && r.status !== "invalid").length,
  };
}

export function TankImportWizard({ canImport, canExportCosts }: TankImportWizardProps) {
  const [step, setStep] = useState<ImportStepId>("upload");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [filename, setFilename] = useState("tank-models.csv");
  const [mimeType, setMimeType] = useState("text/csv");
  const [csvText, setCsvText] = useState("");
  const [fileMeta, setFileMeta] = useState<SelectedFileMeta | null>(null);
  const [preview, setPreview] = useState<PreviewOk | null>(null);
  const [mapping, setMapping] = useState<Record<string, TankCanonicalHeader | "">>({});
  const [rows, setRows] = useState<TankRowValidationResult[]>([]);
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("skip");
  const [importMode, setImportMode] = useState<ImportMode>("valid_rows_only");
  const [filter, setFilter] = useState<TankPreviewFilter>("all");
  const [search, setSearch] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [importStage, setImportStage] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ackHistory, setAckHistory] = useState(false);
  const [result, setResult] = useState<{
    batchId: string;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    failureCount: number;
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
  const importableCount = summary.included;

  function analyse(
    nextCsv: string,
    name: string,
    mime: string,
    override?: Record<string, TankCanonicalHeader | "">,
  ) {
    setAnalysing(true);
    setAnalysisStep(0);
    startTransition(async () => {
      const res = await previewTankImportAction({
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
        templateLabel: "Damtech tank models",
        templateConfidence: res.autoMap.requiresAttention ? 0 : 100,
      });
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

  function setColumnMapping(header: string, target: TankCanonicalHeader | "") {
    const next = { ...mapping, [header]: target };
    setMapping(next);
    analyse(csvText, filename, mimeType, next);
  }

  function toggleRow(rowNumber: number, included: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.rowNumber === rowNumber ? { ...r, excluded: !included } : r)),
    );
  }

  function runImport() {
    setConfirmOpen(false);
    setStep("import");
    setImportStage(0);
    const stageTimer = setInterval(() => setImportStage((s) => (s < 4 ? s + 1 : s)), 300);
    startTransition(async () => {
      const res = await commitTankImportAction({
        filename,
        csvText,
        fileHash: preview?.fileHash ?? "",
        rows,
        duplicateMode,
        importMode,
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
      const res = await exportTankModelsCsvAction(mode);
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      downloadText(res.filename, res.csv);
    });
  }

  const exportItems = [
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
      id: "starter",
      label: "Download starter CSV (39 models)",
      href: "/admin/pricing/tank-models/import/templates/damtech-tank-models-starter.csv/",
    },
    { id: "catalogue", label: "View tank models", href: "/admin/pricing/tank-models/" },
  ];

  const unmatchedHeaders = preview?.autoMap.unmatchedHeaders ?? [];
  const missingRequired = preview?.autoMap.missingRequired ?? [];

  if (!canImport) {
    return (
      <AdminEmptyState
        title="Import requires pricing management permission."
        description="Owner, admin or estimator roles can import tank models."
      />
    );
  }

  return (
    <div className="imp-shell">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <ImportStepper current={step} />
        <AdminActionMenu label="Export & tools" items={exportItems} />
      </div>

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

      {/* Step 2: Review mapping (only when required fields unmatched) */}
      {step === "review" && preview ? (
        <>
          <AdminCard>
            <CsvDropzone
              file={fileMeta}
              disabled={pending}
              onSelect={onSelectFile}
              onRemove={removeFile}
            />
          </AdminCard>
          <AdminCard>
            <h2 className="admin-panel__title" style={{ marginBottom: "0.75rem" }}>
              Match remaining columns
            </h2>
            <AdminInfoBanner tone="warning">
              {missingRequired.length} required field(s) are not matched:{" "}
              {missingRequired.join(", ")}. Map the columns below to continue.
            </AdminInfoBanner>
            <div className="admin-stack" style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
              {unmatchedHeaders.map((header) => (
                <AdminField key={header} label={`Column “${header}”`}>
                  <AdminSelect
                    value={mapping[header] ?? ""}
                    onChange={(e) => setColumnMapping(header, e.target.value as TankCanonicalHeader | "")}
                  >
                    <option value="">Ignore this column</option>
                    {TANK_CANONICAL_HEADERS.map((canon) => (
                      <option key={canon} value={canon}>
                        {canon}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
              ))}
            </div>
          </AdminCard>
        </>
      ) : null}

      {/* Step 3: Preview */}
      {step === "preview" && preview ? (
        <>
          <AdminInfoBanner tone="info">
            <strong>Damtech tank models</strong> recognised · {preview.summary.fieldsMatched} of{" "}
            {preview.summary.totalColumns} columns matched automatically.
          </AdminInfoBanner>

          <AdminCard>
            <h2 className="admin-panel__title" style={{ marginBottom: "0.75rem" }}>
              Validation summary
            </h2>
            <ValidationMetricCards
              active={filter as PreviewFilter}
              onSelect={(f) => setFilter(f as TankPreviewFilter)}
              metrics={[
                { filter: "all", label: "Total rows", value: summary.total },
                { filter: "ready", label: "Ready", value: summary.ready, tone: "success" },
                { filter: "warnings", label: "Warnings", value: summary.warnings, tone: "warning" },
                {
                  filter: "invalid",
                  label: "Invalid",
                  value: summary.invalid,
                  tone: summary.invalid ? "warning" : "muted",
                },
                { filter: "duplicates", label: "Duplicates", value: summary.duplicates, tone: "info" },
                { filter: "manual", label: "Manual", value: summary.manual, tone: "info" },
              ]}
            />
          </AdminCard>

          <AdminCard>
            <h2 className="admin-panel__title" style={{ marginBottom: "0.75rem" }}>
              Import settings
            </h2>
            <div className="admin-form-grid">
              <AdminField
                label="Existing models"
                description="How to handle tank codes already in the catalogue."
              >
                <AdminSelect
                  value={duplicateMode}
                  onChange={(e) => setDuplicateMode(e.target.value as DuplicateMode)}
                >
                  {DUPLICATE_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
              <AdminField label="Import mode" description="Valid rows only, or block on any invalid row.">
                <AdminSelect
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as ImportMode)}
                >
                  <option value="valid_rows_only">Valid rows only</option>
                  <option value="all_or_nothing">All or nothing</option>
                </AdminSelect>
              </AdminField>
            </div>
          </AdminCard>

          <AdminCard>
            <TankImportPreviewTable
              rows={rows}
              canSeeCost={canExportCosts}
              filter={filter}
              onFilterChange={setFilter}
              search={search}
              onSearchChange={setSearch}
              onToggleRow={toggleRow}
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
          <div className="admin-stack" style={{ display: "grid", gap: "1rem" }}>
            <div style={{ textAlign: "center" }}>
              <div className="imp-complete__icon" aria-hidden>
                ✓
              </div>
              <h2 style={{ margin: 0 }}>Import complete</h2>
              <p className="admin-help-text">
                Batch <code className="admin-code">{result.batchId}</code>
              </p>
            </div>
            <ValidationMetricCards
              active="all"
              onSelect={() => {}}
              metrics={[
                { filter: "all", label: "Created", value: result.createdCount, tone: "success" },
                { filter: "all", label: "Updated", value: result.updatedCount, tone: "info" },
                { filter: "all", label: "Skipped", value: result.skippedCount, tone: "muted" },
                {
                  filter: "all",
                  label: "Failed",
                  value: result.failureCount,
                  tone: result.failureCount ? "warning" : "muted",
                },
              ]}
            />
            <AdminInfoBanner tone="info">
              New and updated tank models are now available on the Tank Models page, in RFQ capacity
              matching and in the quote builder. Existing quote snapshots are unchanged.
            </AdminInfoBanner>
            <div className="admin-panel__actions">
              <AdminButton href="/admin/pricing/tank-models/" variant="primary">
                View tank models
              </AdminButton>
              <AdminButton href="/admin/pricing/tank-models/import/history/" variant="outline">
                Import history
              </AdminButton>
              <AdminButton
                type="button"
                variant="ghost"
                onClick={() => {
                  removeFile();
                  setResult(null);
                }}
              >
                Import another CSV
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      ) : null}

      {message ? <AdminInfoBanner tone="warning">{message}</AdminInfoBanner> : null}

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
          <li>{importableCount} tank model(s) will be imported</li>
          <li>
            {summary.duplicates} existing model(s) handled as “{duplicateMode.replaceAll("_", " ")}”
          </li>
          <li>{summary.invalid} invalid row(s) excluded</li>
        </ul>
        <AdminCheckbox
          label="I understand that price changes create new tank price versions and never overwrite history."
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
          primaryLabel={missingRequired.length ? "Resolve required fields" : "Continue to preview"}
          primaryDisabled={missingRequired.length > 0}
          onPrimary={() => setStep("preview")}
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
            summary.invalid > 0 && importMode === "all_or_nothing"
              ? `Review ${summary.invalid} errors`
              : `Import ${importableCount} models`
          }
          primaryDisabled={
            importableCount === 0 || (summary.invalid > 0 && importMode === "all_or_nothing")
          }
          onPrimary={() => {
            if (summary.invalid > 0 && importMode === "all_or_nothing") {
              setFilter("invalid");
              return;
            }
            setAckHistory(false);
            setConfirmOpen(true);
          }}
          onBack={() => setStep("upload")}
        />
      ) : null}
    </div>
  );
}
