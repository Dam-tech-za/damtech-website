"use client";

import { useEffect, useRef, useState } from "react";
import { AdminCheckbox, AdminPanel, AdminTextarea } from "@/components/admin/ui";
import { ClauseEditor } from "@/components/admin/project-templates/ClauseEditor";
import {
  clausesToText,
  parseClauses,
  type Clause,
} from "@/lib/project-templates/clauses";
import { hasCustomerFacingContent } from "@/lib/quotes/content-sections";

type QuoteScopePanelProps = {
  scopeSummary: string;
  assumptions: string;
  exclusions: string;
  customerMessage: string;
  internalNotes: string;
  templateName?: string | null;
  reviewed?: boolean;
  onReviewedChange?: (reviewed: boolean) => void;
  onChange: (field: string, value: string) => void;
};

const TABS = [
  { id: "scope", label: "Scope" },
  { id: "assumptions", label: "Assumptions" },
  { id: "exclusions", label: "Exclusions" },
  { id: "customerMessage", label: "Customer message" },
  { id: "internalNotes", label: "Internal notes" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const CLAUSE_FIELD: Record<string, string> = {
  scope: "scopeSummary",
  assumptions: "assumptions",
  exclusions: "exclusions",
};

export function QuoteScopePanel({
  scopeSummary,
  assumptions,
  exclusions,
  customerMessage,
  internalNotes,
  templateName,
  reviewed = false,
  onReviewedChange,
  onChange,
}: QuoteScopePanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("scope");

  const showReview =
    Boolean(onReviewedChange) &&
    hasCustomerFacingContent({
      scopeSummary,
      assumptions,
      exclusions,
      customerMessage,
    });

  const [scopeClauses, setScopeClauses] = useState<Clause[]>(() =>
    parseClauses(scopeSummary),
  );
  const [assumptionClauses, setAssumptionClauses] = useState<Clause[]>(() =>
    parseClauses(assumptions),
  );
  const [exclusionClauses, setExclusionClauses] = useState<Clause[]>(() =>
    parseClauses(exclusions),
  );

  // Track the text we last emitted upward so external changes (e.g. applying a
  // template) re-seed the clause lists, but our own edits don't loop.
  const emitted = useRef({
    scope: scopeSummary,
    assumptions,
    exclusions,
  });

  useEffect(() => {
    if (scopeSummary !== emitted.current.scope) {
      setScopeClauses(parseClauses(scopeSummary));
      emitted.current.scope = scopeSummary;
    }
  }, [scopeSummary]);
  useEffect(() => {
    if (assumptions !== emitted.current.assumptions) {
      setAssumptionClauses(parseClauses(assumptions));
      emitted.current.assumptions = assumptions;
    }
  }, [assumptions]);
  useEffect(() => {
    if (exclusions !== emitted.current.exclusions) {
      setExclusionClauses(parseClauses(exclusions));
      emitted.current.exclusions = exclusions;
    }
  }, [exclusions]);

  function commitClauses(
    tab: "scope" | "assumptions" | "exclusions",
    clauses: Clause[],
  ) {
    if (tab === "scope") setScopeClauses(clauses);
    if (tab === "assumptions") setAssumptionClauses(clauses);
    if (tab === "exclusions") setExclusionClauses(clauses);
    const text = clausesToText(clauses.filter((c) => c.included));
    emitted.current[tab] = text;
    onChange(CLAUSE_FIELD[tab], text);
  }

  return (
    <AdminPanel id="quote-section-scope" title="Scope & Notes">
      {templateName ? (
        <p className="quote-template-applied">
          Content source: <strong>{templateName}</strong>
        </p>
      ) : null}

      {showReview ? (
        <div className="quote-scope-review">
          <span
            className={`quote-scope-review__status quote-scope-review__status--${
              reviewed ? "reviewed" : "unreviewed"
            }`}
          >
            {reviewed ? "Reviewed" : "Needs review"}
          </span>
          <AdminCheckbox
            label="Customer-facing scope, assumptions, exclusions and message reviewed"
            checked={reviewed}
            onChange={(e) => onReviewedChange?.(e.target.checked)}
          />
          <p className="quote-scope-review__hint">
            Required before sending. Editing customer-facing content clears this.
          </p>
        </div>
      ) : null}

      <nav className="admin-tabs__nav" aria-label="Scope tabs">
        <ul>
          {TABS.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                className={`admin-tabs__link${tab.id === activeTab ? " is-active" : ""}${tab.id === "internalNotes" ? " admin-tabs__link--warning" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                aria-current={tab.id === activeTab ? "true" : undefined}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="admin-tabs__panel">
        {activeTab === "scope" ? (
          <ClauseEditor
            label="Scope"
            clauses={scopeClauses}
            onChange={(c) => commitClauses("scope", c)}
          />
        ) : null}
        {activeTab === "assumptions" ? (
          <ClauseEditor
            label="Assumptions"
            clauses={assumptionClauses}
            onChange={(c) => commitClauses("assumptions", c)}
          />
        ) : null}
        {activeTab === "exclusions" ? (
          <ClauseEditor
            label="Exclusions"
            clauses={exclusionClauses}
            onChange={(c) => commitClauses("exclusions", c)}
          />
        ) : null}
        {activeTab === "customerMessage" ? (
          <AdminTextarea
            name="customerMessage"
            rows={5}
            value={customerMessage}
            onChange={(e) => onChange("customerMessage", e.target.value)}
          />
        ) : null}
        {activeTab === "internalNotes" ? (
          <>
            <p className="admin-info-banner admin-info-banner--warning" role="note">
              <span className="admin-info-banner__icon" aria-hidden>
                !
              </span>
              <span>Internal — not visible to customer</span>
            </p>
            <AdminTextarea
              name="internalNotes"
              rows={5}
              value={internalNotes}
              onChange={(e) => onChange("internalNotes", e.target.value)}
            />
          </>
        ) : null}
      </div>
    </AdminPanel>
  );
}
