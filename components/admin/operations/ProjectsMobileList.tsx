"use client";

import Link from "next/link";
import { useState } from "react";
import {
  GROUP_LABELS,
  PAYMENT_LABEL_TEXT,
  PAYMENT_LABELS,
  PROJECT_GROUPS,
  groupForStage,
  type ProjectGroup,
} from "@/lib/operations/board";
import type { BoardProject } from "@/lib/operations/queries";
import type { BoardToolbarState } from "./BoardToolbar";
import { PaymentPictureBadge } from "./PaymentPictureBadge";

type Props = {
  projects: BoardProject[];
  leads: string[];
  state: BoardToolbarState;
  filterActive: boolean;
  onChange: (patch: Partial<BoardToolbarState>) => void;
  onClear: () => void;
};

/** "R151 038.13" → "R151k". */
function shortValue(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 1_000_000) return `R${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (Math.abs(v) >= 1_000) return `R${Math.round(v / 1_000)}k`;
  return `R${Math.round(v)}`;
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Phones only (the desktop board is unchanged and hidden below 768px):
 * projects as a compact table grouped by stage, one line each, with a small
 * search and filter control on top. Tapping a project opens its full page.
 */
export function ProjectsMobileList({ projects, leads, state, filterActive, onChange, onClear }: Props) {
  const [panel, setPanel] = useState<"none" | "filter" | "search">(state.q ? "search" : "none");
  const [collapsed, setCollapsed] = useState<ProjectGroup[]>([]);
  const groups = PROJECT_GROUPS.map((group) => ({ group, items: projects.filter((p) => groupForStage(p.stage) === group) })).filter(
    (g) => g.items.length > 0 || (!filterActive && g.group !== "completed"),
  );

  return (
    <div className="ops-mlist">
      <div className="ops-mlist__bar">
        <span className="ops-mlist__count">
          {projects.length} project{projects.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          className={`ops-mlist__icon${panel === "search" || state.q ? " is-on" : ""}`}
          aria-label="Search projects"
          aria-expanded={panel === "search"}
          onClick={() => setPanel(panel === "search" ? "none" : "search")}
        >
          <SearchIcon />
        </button>
        <button
          type="button"
          className={`ops-mlist__icon${panel === "filter" || filterActive ? " is-on" : ""}`}
          aria-label="Filter projects"
          aria-expanded={panel === "filter"}
          onClick={() => setPanel(panel === "filter" ? "none" : "filter")}
        >
          <FilterIcon />
          {filterActive ? <span className="ops-mlist__dot" aria-hidden /> : null}
        </button>
      </div>

      {panel === "search" ? (
        <input
          className="admin-input ops-mlist__search"
          type="search"
          value={state.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Customer, site, QU or INV number"
          aria-label="Search projects"
          autoFocus
        />
      ) : null}

      {panel === "filter" ? (
        <div className="ops-mlist__filters">
          <label>
            Stage
            <select className="admin-input" value={state.stageGroup} onChange={(e) => onChange({ stageGroup: e.target.value })}>
              <option value="">All stages</option>
              {PROJECT_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {GROUP_LABELS[g]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Payment
            <select
              className="admin-input"
              value={state.payments[0] ?? ""}
              onChange={(e) => onChange({ payments: e.target.value ? [e.target.value] : [] })}
            >
              <option value="">Any payment</option>
              {PAYMENT_LABELS.map((l) => (
                <option key={l} value={l}>
                  {PAYMENT_LABEL_TEXT[l]}
                </option>
              ))}
              <option value="overdue">Overdue</option>
            </select>
          </label>
          {leads.length ? (
            <label>
              Lead
              <select
                className="admin-input"
                value={state.leads[0] ?? ""}
                onChange={(e) => onChange({ leads: e.target.value ? [e.target.value] : [] })}
              >
                <option value="">Everyone</option>
                {leads.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {filterActive ? (
            <button type="button" className="ops-mlist__clear" onClick={onClear}>
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {groups.length === 0 ? <p className="ops-mlist__empty">No projects match.</p> : null}

      {groups.map(({ group, items }) => {
        const open = !collapsed.includes(group);
        return (
          <section key={group} className={`ops-mlist__group ops-mlist__group--${group}`}>
            <button
              type="button"
              className="ops-mlist__group-title"
              aria-expanded={open}
              onClick={() => setCollapsed((c) => (open ? [...c, group] : c.filter((g) => g !== group)))}
            >
              <span className="ops-mlist__chevron" aria-hidden>
                {open ? "▾" : "▸"}
              </span>
              {GROUP_LABELS[group]} <span className="ops-mlist__n">{items.length}</span>
            </button>
            {open ? (
              <ul className="ops-mlist__rows">
                {items.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/operations/projects/${p.id}/`} className="ops-mlist__row">
                      <span className="ops-mlist__name">
                        <span className="ops-mlist__title">{p.title}</span>
                        <span className="ops-mlist__client">{p.contact_person || p.customer_name}</span>
                      </span>
                      <span className="ops-mlist__value">{shortValue(p.quoted_total_incl_vat)}</span>
                      <span className="ops-mlist__pay">
                        <PaymentPictureBadge payment={p.payment} />
                      </span>
                    </Link>
                  </li>
                ))}
                {items.length === 0 ? <li className="ops-mlist__none">Nothing here</li> : null}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
