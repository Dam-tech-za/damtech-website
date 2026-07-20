"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AdminButton,
  AdminField,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
  AdminEmptyState,
} from "@/components/admin/ui";
import { CANONICAL_HEADERS, type CanonicalHeader } from "@/lib/pricing/csv/columns";
import type { RowValidationResult } from "@/lib/pricing/csv/validate";
import {
  previewInventoryImportAction,
  commitInventoryImportAction,
  exportInventoryCsvAction,
} from "@/app/admin/pricing/import/inventory-actions";
import type { DuplicateMode, ImportMode } from "@/lib/pricing/csv/commit";

type InventoryImportWizardProps = {
  canImport: boolean;
  canExportCosts: boolean;
};

type Step = "upload" | "map" | "preview" | "results";

function statusLabel(status: RowValidationResult["status"]): string {
  return status.replaceAll("_", " ");
}

export function InventoryImportWizard({
  canImport,
  canExportCosts,
}: InventoryImportWizardProps) {
  const [step, setStep] = useState<Step>("upload");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [filename, setFilename] = useState("inventory.csv");
  const [mimeType, setMimeType] = useState<string>("text/csv");
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, CanonicalHeader | "">>({});
  const [rows, setRows] = useState<RowValidationResult[]>([]);
  const [fileHash, setFileHash] = useState("");
  const [summary, setSummary] = useState<{
    total: number;
    ready: number;
    warnings: number;
    invalid: number;
    missingPrice: number;
    manual: number;
    duplicates: number;
  } | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("skip");
  const [importMode, setImportMode] = useState<ImportMode>("valid_rows_only");
  const [result, setResult] = useState<{
    batchId: string;
    successCount: number;
    skippedCount: number;
    failureCount: number;
    warningCount: number;
    errors: string[];
  } | null>(null);

  const unmappedRequired = useMemo(() => {
    const mapped = new Set(Object.values(mapping).filter(Boolean));
    const required: CanonicalHeader[] = ["item_code", "product_name", "quote_unit"];
    // category required too; quote_description can fall back to name
    required.push("category");
    return required.filter((h) => !mapped.has(h));
  }, [mapping]);

  function downloadText(name: string, text: string) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function runPreview(nextMapping?: Record<string, CanonicalHeader | "">) {
    startTransition(async () => {
      const preview = await previewInventoryImportAction({
        filename,
        mimeType,
        csvText,
        mapping: nextMapping ?? mapping,
        byteLength: new TextEncoder().encode(csvText).length,
      });
      if (!preview.ok) {
        setMessage(preview.error);
        return;
      }
      setHeaders(preview.headers);
      setMapping(preview.mapping);
      setRows(preview.rows);
      setFileHash(preview.fileHash);
      setSummary(preview.summary);
      setMessage(null);
      setStep(nextMapping || Object.keys(mapping).length ? "preview" : "map");
      if (!nextMapping && preview.headers.length) setStep("map");
    });
  }

  return (
    <div className="admin-stack">
      <AdminPanel title="Export inventory">
        <div className="admin-panel__actions">
          {canExportCosts ? (
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const res = await exportInventoryCsvAction("full");
                  if (!res.ok) {
                    setMessage(res.error);
                    return;
                  }
                  downloadText(res.filename, res.csv);
                });
              }}
            >
              Export full inventory (with costs)
            </AdminButton>
          ) : null}
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const res = await exportInventoryCsvAction("sell");
                if (!res.ok) {
                  setMessage(res.error);
                  return;
                }
                downloadText(res.filename, res.csv);
              });
            }}
          >
            Export sell-price catalogue
          </AdminButton>
          <AdminButton href="/admin/pricing/import/history/" variant="outline" size="sm">
            Import history
          </AdminButton>
        </div>
      </AdminPanel>

      {!canImport ? (
        <AdminEmptyState
          title="Import requires pricing management permission."
          description="Owner, admin or estimator roles can import inventory CSVs."
        />
      ) : (
        <>
          {step === "upload" || step === "map" || step === "preview" ? (
            <AdminPanel title="1. Upload CSV">
              <div className="admin-stack">
                <AdminField label="CSV file">
                  <input
                    className="admin-input"
                    type="file"
                    accept=".csv,text/csv,application/vnd.ms-excel"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setFilename(file.name);
                      setMimeType(file.type || "text/csv");
                      const text = await file.text();
                      setCsvText(text);
                      setResult(null);
                      setStep("upload");
                    }}
                  />
                </AdminField>
                <p className="admin-help-text">
                  Accepts the Damtech starter format (`item_code,category,name,…`) and the full
                  canonical inventory template. Max 5 MB / 5 000 rows. UTF-8 with BOM recommended for
                  Excel (m² / m³).
                </p>
                <AdminButton
                  type="button"
                  variant="primary"
                  disabled={pending || !csvText.trim()}
                  onClick={() => runPreview()}
                >
                  {pending ? "Validating…" : "Parse & continue"}
                </AdminButton>
              </div>
            </AdminPanel>
          ) : null}

          {step === "map" || step === "preview" ? (
            <AdminPanel title="2. Column mapping">
              <p className="admin-help-text">
                Unmapped columns are ignored. Required: item_code, category, product_name (or name),
                quote_unit (or unit).
              </p>
              {unmappedRequired.length ? (
                <p className="admin-help-text">
                  Still need: {unmappedRequired.join(", ")}
                </p>
              ) : null}
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>CSV column</th>
                      <th>Maps to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((header) => (
                      <tr key={header}>
                        <td>{header}</td>
                        <td>
                          <AdminSelect
                            value={mapping[header] ?? ""}
                            onChange={(e) => {
                              const value = e.target.value as CanonicalHeader | "";
                              setMapping((prev) => ({ ...prev, [header]: value }));
                            }}
                          >
                            <option value="">— ignore —</option>
                            {CANONICAL_HEADERS.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </AdminSelect>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="admin-panel__actions" style={{ marginTop: "0.75rem" }}>
                <AdminButton
                  type="button"
                  variant="primary"
                  disabled={pending || unmappedRequired.length > 0}
                  onClick={() => runPreview(mapping)}
                >
                  Validate & preview
                </AdminButton>
              </div>
            </AdminPanel>
          ) : null}

          {step === "preview" && summary ? (
            <AdminPanel title="3. Preview & confirm">
              <dl className="admin-dl admin-metric-strip--inline">
                <div>
                  <dt>Rows</dt>
                  <dd>{summary.total}</dd>
                </div>
                <div>
                  <dt>Ready</dt>
                  <dd>{summary.ready}</dd>
                </div>
                <div>
                  <dt>Warnings</dt>
                  <dd>{summary.warnings + summary.manual}</dd>
                </div>
                <div>
                  <dt>Duplicates</dt>
                  <dd>{summary.duplicates}</dd>
                </div>
                <div>
                  <dt>Invalid</dt>
                  <dd>{summary.invalid}</dd>
                </div>
              </dl>

              <div className="admin-form-grid" style={{ marginTop: "1rem" }}>
                <AdminField label="Duplicate behaviour">
                  <AdminSelect
                    value={duplicateMode}
                    onChange={(e) => setDuplicateMode(e.target.value as DuplicateMode)}
                  >
                    <option value="skip">Skip existing item (default)</option>
                    <option value="update_fields">Update non-price fields + new price version</option>
                    <option value="add_price">Add new price version only</option>
                    <option value="reactivate">Reactivate archived + update</option>
                  </AdminSelect>
                </AdminField>
                <AdminField label="Import mode">
                  <AdminSelect
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as ImportMode)}
                  >
                    <option value="valid_rows_only">Valid rows only (default)</option>
                    <option value="all_or_nothing">All or nothing</option>
                  </AdminSelect>
                </AdminField>
              </div>

              <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Unit</th>
                      <th>Cost</th>
                      <th>Sell</th>
                      <th>Status</th>
                      <th>Include</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td>{row.rowNumber}</td>
                        <td>{row.data?.item_code ?? row.raw.item_code ?? "—"}</td>
                        <td>{row.data?.product_name ?? row.raw.product_name ?? "—"}</td>
                        <td>{row.data?.item_type ?? "—"}</td>
                        <td>{row.data?.quote_unit ?? "—"}</td>
                        <td>
                          {canExportCosts
                            ? row.data?.default_cost_ex_vat_zar ?? "—"
                            : "•"}
                        </td>
                        <td>{row.data?.recommended_sell_ex_vat_zar ?? "—"}</td>
                        <td>
                          <AdminStatusBadge status={row.status} label={statusLabel(row.status)} domain="pricing" />
                          {row.errors[0] || row.warnings[0] ? (
                            <div className="admin-help-text">
                              {row.errors[0] ?? row.warnings[0]}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={!row.excluded && row.status !== "invalid"}
                            disabled={row.status === "invalid"}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.rowNumber === row.rowNumber
                                    ? { ...r, excluded: !checked }
                                    : r,
                                ),
                              );
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-panel__actions" style={{ marginTop: "1rem" }}>
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const lines = [
                      "row,item_code,field,error",
                      ...rows
                        .filter((r) => r.errors.length)
                        .flatMap((r) =>
                          r.errors.map(
                            (err) =>
                              `${r.rowNumber},${r.data?.item_code ?? r.raw.item_code ?? ""},,${JSON.stringify(err)}`,
                          ),
                        ),
                    ];
                    downloadText("import-errors.csv", lines.join("\n"));
                  }}
                >
                  Download error report
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="primary"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const res = await commitInventoryImportAction({
                        filename,
                        csvText,
                        fileHash,
                        rows,
                        duplicateMode,
                        importMode,
                        makePreferred: true,
                      });
                      if (!res.ok) {
                        setMessage(res.error);
                        return;
                      }
                      setResult(res);
                      setStep("results");
                      setMessage(
                        `Imported ${res.successCount} · skipped ${res.skippedCount} · failed ${res.failureCount}`,
                      );
                    });
                  }}
                >
                  {pending ? "Importing…" : "Confirm import"}
                </AdminButton>
              </div>
            </AdminPanel>
          ) : null}

          {step === "results" && result ? (
            <AdminPanel title="4. Results">
              <p>
                Batch <code>{result.batchId}</code>
              </p>
              <ul className="admin-list">
                <li>Imported: {result.successCount}</li>
                <li>Skipped: {result.skippedCount}</li>
                <li>Failed: {result.failureCount}</li>
                <li>Warnings: {result.warningCount}</li>
              </ul>
              {result.errors.length ? (
                <ul className="admin-list">
                  {result.errors.slice(0, 20).map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              ) : null}
              <div className="admin-panel__actions">
                <AdminButton href="/admin/pricing/materials/" variant="primary">
                  View materials
                </AdminButton>
                <AdminButton href="/admin/quotes/new/" variant="secondary">
                  Open quote builder
                </AdminButton>
                <AdminButton href="/admin/pricing/import/history/" variant="outline">
                  Import history
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep("upload");
                    setCsvText("");
                    setRows([]);
                    setResult(null);
                  }}
                >
                  Import another file
                </AdminButton>
              </div>
            </AdminPanel>
          ) : null}
        </>
      )}

      {message ? <p className="admin-help-text">{message}</p> : null}
    </div>
  );
}
