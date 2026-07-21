"use client";

import { useMemo, useState } from "react";
import { AdminButton, AdminDrawer, AdminSelect } from "@/components/admin/ui";
import { CANONICAL_HEADERS, type CanonicalHeader } from "@/lib/pricing/csv/columns";
import type { AutoMapResult, ColumnMatch } from "@/lib/pricing/import/import-types";

type ColumnMappingDrawerProps = {
  open: boolean;
  autoMap: AutoMapResult;
  mapping: Record<string, CanonicalHeader | "">;
  onClose: () => void;
  onApply: (mapping: Record<string, CanonicalHeader | "">) => void;
};

function confClass(status: ColumnMatch["status"]): string {
  return `imp-conf imp-conf--${status}`;
}

function MappingRow({
  match,
  value,
  usedTargets,
  onChange,
}: {
  match: ColumnMatch;
  value: CanonicalHeader | "";
  usedTargets: Set<string>;
  onChange: (target: CanonicalHeader | "") => void;
}) {
  return (
    <div className="imp-map-row">
      <div style={{ minWidth: 0 }}>
        <div className="imp-map-row__source">{match.sourceHeader}</div>
        <div className="imp-map-row__badges">
          <span className={confClass(match.status)}>
            {match.status} {match.confidence ? `· ${match.confidence}%` : ""}
          </span>
          <span className="imp-map-row__target">{match.method.replaceAll("_", " ")}</span>
        </div>
      </div>
      <AdminSelect
        aria-label={`Map ${match.sourceHeader} to`}
        value={value}
        onChange={(e) => onChange(e.target.value as CanonicalHeader | "")}
      >
        <option value="">— ignore —</option>
        {CANONICAL_HEADERS.map((h) => (
          <option key={h} value={h} disabled={h !== value && usedTargets.has(h)}>
            {h}
            {h !== value && usedTargets.has(h) ? " (in use)" : ""}
          </option>
        ))}
      </AdminSelect>
    </div>
  );
}

export function ColumnMappingDrawer({
  open,
  autoMap,
  mapping,
  onClose,
  onApply,
}: ColumnMappingDrawerProps) {
  const [draft, setDraft] = useState<Record<string, CanonicalHeader | "">>(mapping);
  const [wasOpen, setWasOpen] = useState(false);

  // Reset the working copy when the drawer transitions to open (render-time
  // state adjustment rather than an effect).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(mapping);
  }

  const usedTargets = useMemo(() => {
    const set = new Set<string>();
    for (const v of Object.values(draft)) if (v) set.add(v);
    return set;
  }, [draft]);

  const matched = autoMap.matches.filter((m) => m.autoAccepted);
  const review = autoMap.matches.filter((m) => !m.autoAccepted && m.target);
  const ignored = autoMap.matches.filter((m) => !m.target);

  function setTarget(header: string, target: CanonicalHeader | "") {
    setDraft((prev) => ({ ...prev, [header]: target }));
  }

  const rowFor = (m: ColumnMatch) => (
    <MappingRow
      key={m.sourceHeader}
      match={m}
      value={draft[m.sourceHeader] ?? ""}
      usedTargets={usedTargets}
      onChange={(t) => setTarget(m.sourceHeader, t)}
    />
  );

  return (
    <AdminDrawer open={open} title="Review column mapping" onClose={onClose}>
      <div className="admin-stack" style={{ display: "grid", gap: "0.75rem", paddingBottom: "4rem" }}>
        {autoMap.missingRequired.length ? (
          <p className="admin-field-error">
            Required fields not mapped: {autoMap.missingRequired.join(", ")}
          </p>
        ) : null}

        {review.length ? (
          <details className="imp-map-section" open>
            <summary>Needs review ({review.length})</summary>
            {review.map(rowFor)}
          </details>
        ) : null}

        {ignored.length ? (
          <details className="imp-map-section" open>
            <summary>Unknown / ignored columns ({ignored.length})</summary>
            {ignored.map(rowFor)}
          </details>
        ) : null}

        <details className="imp-map-section">
          <summary>Matched automatically ({matched.length})</summary>
          {matched.map(rowFor)}
        </details>
      </div>

      <div className="admin-dialog__footer" style={{ position: "sticky", bottom: 0, background: "#fff" }}>
        <AdminButton type="button" variant="ghost" onClick={() => setDraft(autoMap.mapping)}>
          Reset automatic matches
        </AdminButton>
        <AdminButton type="button" variant="secondary" onClick={onClose}>
          Cancel
        </AdminButton>
        <AdminButton type="button" variant="primary" onClick={() => onApply(draft)}>
          Apply mappings
        </AdminButton>
      </div>
    </AdminDrawer>
  );
}
