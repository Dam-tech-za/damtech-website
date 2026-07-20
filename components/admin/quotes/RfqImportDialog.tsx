"use client";

import { useState } from "react";
import {
  AdminButton,
  AdminDialog,
  AdminField,
  AdminInput,
  AdminInfoBanner,
} from "@/components/admin/ui";
import type { RfqImportPreview, RfqSearchResult } from "@/lib/quotes/import-rfq";

type RfqImportDialogProps = {
  open: boolean;
  onClose: () => void;
  currentCustomerId?: string;
  onSearch: (query: string) => Promise<
    | { ok: true; results: RfqSearchResult[] }
    | { ok: false; error: string }
  >;
  onLoadPreview: (rfqId: string) => Promise<
    | { ok: true; preview: RfqImportPreview }
    | { ok: false; error: string }
  >;
  onApply: (preview: RfqImportPreview) => void;
};

export function RfqImportDialog({
  open,
  onClose,
  currentCustomerId,
  onSearch,
  onLoadPreview,
  onApply,
}: RfqImportDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RfqSearchResult[]>([]);
  const [preview, setPreview] = useState<RfqImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSearch() {
    setPending(true);
    setError(null);
    setPreview(null);
    const result = await onSearch(query);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      setResults([]);
      return;
    }
    setResults(result.results);
  }

  async function handleSelect(rfqId: string) {
    setPending(true);
    setError(null);
    const result = await onLoadPreview(rfqId);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPreview(result.preview);
  }

  function handleApply() {
    if (!preview) return;
    onApply(preview);
    onClose();
  }

  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title="Import from RFQ"
      footer={
        <>
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton
            type="button"
            variant="primary"
            disabled={!preview || pending}
            onClick={handleApply}
          >
            Apply to quote
          </AdminButton>
        </>
      }
    >
      <div className="admin-stack">
        <AdminField label="Search RFQ">
          <div className="admin-inline-form">
            <AdminInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="RFQ number, customer, service or location"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSearch();
                }
              }}
            />
            <AdminButton type="button" variant="secondary" onClick={() => void handleSearch()} disabled={pending}>
              Search
            </AdminButton>
          </div>
        </AdminField>

        {error ? (
          <p className="admin-field-error" role="alert">
            {error}
          </p>
        ) : null}

        {results.length > 0 && !preview ? (
          <ul className="admin-list admin-list--selectable">
            {results.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="admin-list-select-item"
                  onClick={() => void handleSelect(row.id)}
                >
                  <strong>{row.rfqNumber}</strong>
                  <span>
                    {row.contactName || row.companyName || "Unknown customer"}
                    {row.serviceRequired ? ` · ${row.serviceRequired}` : ""}
                    {row.projectLocation ? ` · ${row.projectLocation}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {preview ? (
          <div className="admin-stack">
            {preview.customerMismatch && currentCustomerId ? (
              <AdminInfoBanner tone="warning">
                This RFQ belongs to a different customer. Applying will replace the current
                customer selection.
              </AdminInfoBanner>
            ) : null}
            <p className="admin-help-text">
              {preview.rfqNumber} · {preview.contactName || preview.companyName}
            </p>
            <dl className="admin-dl">
              <div>
                <dt>Project</dt>
                <dd>{preview.title}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{preview.projectLocation || "Not provided"}</dd>
              </div>
              <div>
                <dt>Suggested lines</dt>
                <dd>{preview.suggestedLines.length}</dd>
              </div>
            </dl>
            {preview.suggestedLines.length ? (
              <AdminInfoBanner tone="warning">
                Suggested quantities originate from customer or calculator information and
                require estimator confirmation.
              </AdminInfoBanner>
            ) : null}
            <AdminButton type="button" variant="ghost" size="sm" onClick={() => setPreview(null)}>
              Choose a different RFQ
            </AdminButton>
          </div>
        ) : null}
      </div>
    </AdminDialog>
  );
}
