"use client";

import { useState } from "react";
import { AdminPanel, AdminTextarea } from "@/components/admin/ui";

type QuoteScopePanelProps = {
  scopeSummary: string;
  assumptions: string;
  exclusions: string;
  customerMessage: string;
  internalNotes: string;
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

export function QuoteScopePanel({
  scopeSummary,
  assumptions,
  exclusions,
  customerMessage,
  internalNotes,
  onChange,
}: QuoteScopePanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("scope");

  const fieldValues: Record<TabId, string> = {
    scope: scopeSummary,
    assumptions,
    exclusions,
    customerMessage,
    internalNotes,
  };

  const fieldNames: Record<TabId, string> = {
    scope: "scopeSummary",
    assumptions: "assumptions",
    exclusions: "exclusions",
    customerMessage: "customerMessage",
    internalNotes: "internalNotes",
  };

  return (
    <AdminPanel id="quote-section-scope" title="Scope & Notes">
      <nav className="admin-tabs__nav" aria-label="Scope tabs">
        <ul>
          {TABS.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                className={`admin-tabs__link${tab.id === activeTab ? " is-active" : ""}${tab.id === "internalNotes" ? " admin-tabs__link--warning" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="admin-tabs__panel">
        {activeTab === "internalNotes" ? (
          <p className="admin-info-banner admin-info-banner--warning" role="note">
            <span className="admin-info-banner__icon" aria-hidden>!</span>
            <span>Internal — not visible to customer</span>
          </p>
        ) : null}
        <AdminTextarea
          name={fieldNames[activeTab]}
          rows={5}
          value={fieldValues[activeTab]}
          onChange={(e) => onChange(fieldNames[activeTab], e.target.value)}
        />
      </div>
    </AdminPanel>
  );
}
