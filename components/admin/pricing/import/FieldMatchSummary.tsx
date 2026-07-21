"use client";

import { AdminButton } from "@/components/admin/ui";
import type { AutoMapResult, ColumnMatch } from "@/lib/pricing/import/import-types";
import type { CanonicalHeader } from "@/lib/pricing/csv/columns";

type FieldMatchSummaryProps = {
  autoMap: AutoMapResult;
  mapping: Record<string, CanonicalHeader | "">;
  onReviewMapping: () => void;
  onAccept: (header: string, target: CanonicalHeader) => void;
  onIgnore: (header: string) => void;
};

export function FieldMatchSummary({
  autoMap,
  mapping,
  onReviewMapping,
  onAccept,
  onIgnore,
}: FieldMatchSummaryProps) {
  const ignoredCount = autoMap.matches.filter(
    (m) => !mapping[m.sourceHeader] && !m.autoAccepted,
  ).length;
  const needReview = autoMap.matches.filter(
    (m) => !m.autoAccepted && !mapping[m.sourceHeader],
  );

  return (
    <div className="admin-stack" style={{ display: "grid", gap: "0.85rem" }}>
      <div className="imp-field-match">
        <span className="imp-field-match__stat">
          <span className="imp-field-match__num" style={{ color: "#166534" }}>
            {autoMap.autoAcceptedCount}
          </span>{" "}
          matched automatically
        </span>
        <span className="imp-field-match__stat">
          <span className="imp-field-match__num" style={{ color: "#9a6b12" }}>
            {needReview.length}
          </span>{" "}
          need review
        </span>
        <span className="imp-field-match__stat">
          <span className="imp-field-match__num" style={{ color: "#5b6b7c" }}>
            {ignoredCount}
          </span>{" "}
          ignored
        </span>
        <AdminButton
          type="button"
          size="sm"
          variant="secondary"
          onClick={onReviewMapping}
          style={{ marginLeft: "auto" }}
        >
          Review mapping
        </AdminButton>
      </div>

      {needReview.map((m: ColumnMatch) => {
        const isError = autoMap.missingRequired.length > 0 && m.status === "unmatched";
        return (
          <div
            key={m.sourceHeader}
            className={`imp-attention-card${m.status === "conflict" || isError ? " imp-attention-card--error" : ""}`}
          >
            <p className="imp-attention-card__title">
              {m.status === "conflict"
                ? "Duplicate mapping"
                : m.status === "suggested"
                  ? "Uncertain match"
                  : "Unknown column"}
              {": "}
              <code className="admin-code">{m.sourceHeader}</code>
            </p>
            {m.target ? (
              <p className="admin-help-text">
                Suggested match: <strong>{m.target}</strong> ({m.confidence}%,{" "}
                {m.method.replaceAll("_", " ")})
              </p>
            ) : (
              <p className="admin-help-text">No confident match found.</p>
            )}
            <div className="imp-attention-card__actions">
              {m.target ? (
                <AdminButton
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => onAccept(m.sourceHeader, m.target as CanonicalHeader)}
                >
                  Accept
                </AdminButton>
              ) : null}
              <AdminButton type="button" size="sm" variant="secondary" onClick={onReviewMapping}>
                Choose field
              </AdminButton>
              <AdminButton type="button" size="sm" variant="ghost" onClick={() => onIgnore(m.sourceHeader)}>
                Ignore
              </AdminButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}
