"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateBoardFieldAction } from "@/app/admin/operations/board-field-actions";
import type { ProjectQuoteRef } from "@/app/admin/operations/quote-view-actions";
import { formatOpsMoney } from "@/components/admin/operations/ops-format";
import { QuoteView } from "@/components/admin/operations/QuoteViewer";

/** Project lead picked from the Person list (the board's master list). */
export function LeadSelect({ projectId, current, options }: { projectId: string; current: string | null; options: string[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const value = current ?? "";
  const offList = Boolean(value) && !options.some((o) => o.toLowerCase() === value.toLowerCase());
  return (
    <span className="pj-lead">
      <select
        className="admin-select"
        value={value}
        disabled={saving}
        aria-label="Project lead"
        onChange={async (e) => {
          setSaving(true);
          setError(null);
          const r = await updateBoardFieldAction({ id: projectId, field: "lead", value: e.target.value });
          setSaving(false);
          if (!r?.ok) setError(r?.message || "Could not save.");
          else router.refresh();
        }}
      >
        <option value="">No lead</option>
        {offList ? <option value={value}>{value} (not on list)</option> : null}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {error ? <span className="pj-error" role="alert">{error}</span> : null}
    </span>
  );
}

/** The project's Xero quotes with a live, read-only viewer. */
export function ProjectQuotes({ projectId, quotes }: { projectId: string; quotes: ProjectQuoteRef[] }) {
  const [open, setOpen] = useState<ProjectQuoteRef | null>(null);
  if (open) {
    return <QuoteView projectId={projectId} quoteRef={open} onBack={() => setOpen(null)} backLabel="← All quotes" />;
  }
  if (!quotes.length) return <p className="pj-muted">No Xero quote linked. Link one below with its number.</p>;
  return (
    <ul className="pj-list">
      {quotes.map((q) => (
        <li key={q.quoteId ?? q.number}>
          <span>
            <strong>{q.number}</strong>
            <span className="pj-muted">
              {[q.status?.toLowerCase(), q.total !== null ? formatOpsMoney(q.total) : null, q.quoteId ? null : "number only"].filter(Boolean).join(" · ")}
            </span>
          </span>
          <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => setOpen(q)}>
            View quote
          </button>
        </li>
      ))}
    </ul>
  );
}
