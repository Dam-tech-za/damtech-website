"use client";

import { useState, useTransition } from "react";
import {
  AdminButton,
  AdminField,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui";
import { previewCsvImportAction, commitCsvImportAction, exportPricingCsvAction } from "@/app/admin/pricing/import/actions";

type CsvImportClientProps = {
  canExportCosts: boolean;
  canImport?: boolean;
};

export function CsvImportClient({ canExportCosts, canImport = true }: CsvImportClientProps) {
  const [dataType, setDataType] = useState("materials");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<{
    rows: number;
    errors: string[];
    sample: string[];
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function downloadCsv(filename: string, csv: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <AdminPanel title="Export CSV">
        <p className="admin-help-text">
          {canExportCosts
            ? "Exports include cost columns for your role."
            : "Exports include selling prices only — cost columns are masked."}
        </p>
        <div className="admin-panel__actions">
          <AdminButton
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await exportPricingCsvAction("materials");
                if (!result.ok) {
                  setMessage(result.error);
                  return;
                }
                downloadCsv(result.filename, result.csv);
                setMessage(`Exported ${result.filename}`);
              });
            }}
          >
            Export materials
          </AdminButton>
          <AdminButton
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await exportPricingCsvAction("labour");
                if (!result.ok) {
                  setMessage(result.error);
                  return;
                }
                downloadCsv(result.filename, result.csv);
                setMessage(`Exported ${result.filename}`);
              });
            }}
          >
            Export labour
          </AdminButton>
        </div>
      </AdminPanel>

      {canImport ? (
      <AdminPanel title="Import CSV">
      <div className="admin-stack">
        <AdminField label="Data type">
          <AdminSelect value={dataType} onChange={(e) => setDataType(e.target.value)}>
            <option value="materials">Materials</option>
            <option value="labour">Labour roles</option>
            <option value="supplier_prices">Supplier prices (preview only)</option>
            <option value="travel_vehicles">Travel vehicles (preview only)</option>
          </AdminSelect>
        </AdminField>
        <AdminField label="CSV content">
          <AdminTextarea
            rows={10}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste CSV including header row…"
          />
        </AdminField>
        <div className="admin-panel__actions">
          <AdminButton
            type="button"
            variant="secondary"
            disabled={pending || !csvText.trim()}
            onClick={() => {
              startTransition(async () => {
                const result = await previewCsvImportAction(dataType, csvText);
                if (!result.ok) {
                  setMessage(result.error);
                  setPreview(null);
                  return;
                }
                setPreview(result.preview);
                setMessage(null);
              });
            }}
          >
            Validate & preview
          </AdminButton>
          <AdminButton
            type="button"
            variant="primary"
            disabled={pending || !preview || preview.errors.length > 0}
            onClick={() => {
              startTransition(async () => {
                const result = await commitCsvImportAction(dataType, csvText);
                setMessage(
                  result.ok
                    ? `Imported ${result.imported} rows.`
                    : result.error ?? "Import failed.",
                );
              });
            }}
          >
            Confirm import
          </AdminButton>
        </div>
        {preview ? (
          <div>
            <p className="admin-help-text">
              {preview.rows} rows · {preview.errors.length} validation errors
              {!canExportCosts ? " · cost columns ignored for this role" : ""}
            </p>
            {preview.errors.length ? (
              <ul className="admin-list">
                {preview.errors.slice(0, 20).map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            ) : (
              <ul className="admin-list">
                {preview.sample.map((row) => (
                  <li key={row}>{row}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
        {message ? <p className="admin-help-text">{message}</p> : null}
      </div>
    </AdminPanel>
      ) : message ? (
        <p className="admin-help-text">{message}</p>
      ) : null}
    </>
  );
}
