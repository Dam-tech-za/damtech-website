"use client";

import { AdminStatusBadge } from "@/components/admin/ui";
import type { AutoMapResult, TemplateDetection } from "@/lib/pricing/import/import-types";

const ANALYSIS_STEPS = [
  "Reading headers",
  "Detecting template",
  "Matching fields",
  "Validating rows",
];

export function ImportAnalysisProgress({ activeIndex }: { activeIndex: number }) {
  return (
    <ul className="imp-analysis__list" aria-live="polite">
      {ANALYSIS_STEPS.map((label, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        return (
          <li
            key={label}
            className={`imp-analysis__step${done ? " imp-analysis__step--done" : ""}${
              active ? " imp-analysis__step--active" : ""
            }`}
          >
            <span className="imp-analysis__tick" aria-hidden>
              {done ? "✓" : active ? "•" : ""}
            </span>
            {label}
          </li>
        );
      })}
    </ul>
  );
}

type RecognisedProps = {
  template: TemplateDetection;
  autoMap: AutoMapResult;
  rowsFound: number;
};

export function ImportAnalysisSummary({ template, autoMap, rowsFound }: RecognisedProps) {
  const clean =
    autoMap.missingRequired.length === 0 &&
    autoMap.unmatchedHeaders.length === 0 &&
    autoMap.conflicts.length === 0;

  return (
    <div className="admin-stack" style={{ display: "grid", gap: "0.85rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <strong>{clean ? "CSV recognised" : "CSV analysed"}</strong>
        <AdminStatusBadge
          status={clean ? "ready_for_validation" : "warning"}
          label={clean ? "Ready for validation" : "Needs review"}
          domain="pricing"
        />
      </div>
      <div className="imp-recognised">
        <div className="imp-recognised__cell">
          <span className="imp-recognised__value">
            {autoMap.autoAcceptedCount} of {autoMap.matches.length}
          </span>
          <span className="imp-recognised__label">Fields matched</span>
        </div>
        <div className="imp-recognised__cell">
          <span className="imp-recognised__value">{rowsFound}</span>
          <span className="imp-recognised__label">Rows detected</span>
        </div>
        <div className="imp-recognised__cell">
          <span className="imp-recognised__value">{autoMap.unmatchedHeaders.length}</span>
          <span className="imp-recognised__label">Unknown columns</span>
        </div>
        <div className="imp-recognised__cell">
          <span className="imp-recognised__value">{autoMap.missingRequired.length}</span>
          <span className="imp-recognised__label">Missing required</span>
        </div>
        <div className="imp-recognised__cell">
          <span className="imp-recognised__value">{template.label}</span>
          <span className="imp-recognised__label">Template</span>
        </div>
      </div>
    </div>
  );
}
