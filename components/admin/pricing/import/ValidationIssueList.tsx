"use client";

import { AdminButton } from "@/components/admin/ui";
import type { PreviewFilter } from "./types";

export type ImportIssue = {
  id: string;
  group: string;
  severity: "error" | "warning" | "info";
  count: number;
  description: string;
  filter?: PreviewFilter;
};

type ValidationIssueListProps = {
  issues: ImportIssue[];
  onViewRows: (filter: PreviewFilter) => void;
};

export function ValidationIssueList({ issues, onViewRows }: ValidationIssueListProps) {
  if (!issues.length) {
    return (
      <p className="admin-help-text" style={{ color: "#166534" }}>
        No validation issues detected.
      </p>
    );
  }

  return (
    <div className="imp-issues">
      {issues.map((issue) => (
        <div key={issue.id} className={`imp-issue imp-issue--${issue.severity}`}>
          <div className="imp-issue__body">
            <p className="imp-issue__title">
              {issue.group} · {issue.count}
            </p>
            <p className="imp-issue__desc">{issue.description}</p>
          </div>
          {issue.filter ? (
            <AdminButton
              type="button"
              size="sm"
              variant="ghost"
              className="imp-issue__action"
              onClick={() => onViewRows(issue.filter as PreviewFilter)}
            >
              View affected rows
            </AdminButton>
          ) : null}
        </div>
      ))}
    </div>
  );
}
