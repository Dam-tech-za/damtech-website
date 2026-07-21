"use client";

import type { PreviewFilter } from "./types";

type Metric = {
  filter: PreviewFilter;
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "info" | "muted";
};

type ValidationMetricCardsProps = {
  metrics: Metric[];
  active: PreviewFilter;
  onSelect: (filter: PreviewFilter) => void;
};

export function ValidationMetricCards({ metrics, active, onSelect }: ValidationMetricCardsProps) {
  return (
    <div className="admin-metric-strip" role="group" aria-label="Validation summary">
      {metrics.map((m) => (
        <button
          key={m.filter}
          type="button"
          className={`admin-metric-compact admin-metric-compact--${m.tone ?? "default"}${
            active === m.filter ? " is-active" : ""
          }`}
          aria-pressed={active === m.filter}
          onClick={() => onSelect(m.filter)}
          style={{ textAlign: "left", cursor: "pointer", font: "inherit" }}
        >
          <span className="admin-metric-compact__label">{m.label}</span>
          <span className="admin-metric-compact__value">{m.value}</span>
        </button>
      ))}
    </div>
  );
}
