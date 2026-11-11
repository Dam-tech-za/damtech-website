"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Chevron,
  IconFilter,
  IconHide,
  IconMore,
  IconPerson,
  IconSearch,
  IconSort,
  ToolbarPopover,
} from "@/components/admin/board/BoardKit";
import { addProjectLeadAction, deleteProjectLeadAction } from "@/app/admin/operations/lead-actions";
import {
  DISTANCE_BAND_LABELS,
  DISTANCE_BANDS,
  GROUP_LABELS,
  OFFICE_FILTER_LABELS,
  OFFICE_FILTERS,
  PAYMENT_LABEL_TEXT,
  PAYMENT_LABELS,
  PRICE_BAND_LABELS,
  PRICE_BANDS,
  PROJECT_GROUPS,
  type BoardFilters,
  type ProjectGroup,
} from "@/lib/operations/board";

export type BoardColumnId = "type" | "next" | "lead" | "client" | "email" | "xero" | "value" | "location";

export const BOARD_COLUMNS: { id: BoardColumnId; label: string }[] = [
  { id: "type", label: "Type" },
  { id: "next", label: "Next on site" },
  { id: "lead", label: "Lead" },
  { id: "client", label: "Client" },
  { id: "location", label: "Location" },
  { id: "xero", label: "Xero" },
  { id: "value", label: "Value" },
  { id: "email", label: "Email" },
];

/** Columns hidden until someone turns them on (Email is rarely needed for project work). */
export const DEFAULT_HIDDEN_COLUMNS: BoardColumnId[] = ["email"];

function columnsChanged(hidden: BoardColumnId[]): boolean {
  return hidden.length !== DEFAULT_HIDDEN_COLUMNS.length || hidden.some((c) => !DEFAULT_HIDDEN_COLUMNS.includes(c));
}

export type BoardToolbarState = {
  q: string;
  leads: string[];
  payments: string[];
  price: string;
  priceMin: string;
  priceMax: string;
  office: string;
  distance: string;
  stageGroup: string;
  sort: BoardFilters["sort"];
  sortDir: "asc" | "desc";
  hiddenColumns: BoardColumnId[];
};

type Props = {
  state: BoardToolbarState;
  leads: string[];
  /** Names on the saved Person list (these can be removed); null if the list is not installed. */
  savedLeads?: string[] | null;
  canEdit: boolean;
  frozen: boolean;
  onChange: (patch: Partial<BoardToolbarState>) => void;
  onClear: () => void;
  onNewProject: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleFreeze: () => void;
  onExportCsv: () => void;
};

type PopoverId = "person" | "filter" | "sort" | "hide" | "more" | null;


export function BoardToolbar({
  state,
  leads,
  savedLeads = null,
  canEdit,
  frozen,
  onChange,
  onClear,
  onNewProject,
  onExpandAll,
  onCollapseAll,
  onToggleFreeze,
  onExportCsv,
}: Props) {
  const [open, setOpen] = useState<PopoverId>(null);
  const [searchOpen, setSearchOpen] = useState(Boolean(state.q));
  const searchRef = useRef<HTMLInputElement>(null);
  const personBtn = useRef<HTMLButtonElement>(null);
  const filterBtn = useRef<HTMLButtonElement>(null);
  const sortBtn = useRef<HTMLButtonElement>(null);
  const hideBtn = useRef<HTMLButtonElement>(null);
  const moreBtn = useRef<HTMLButtonElement>(null);
  const searchId = useId();

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const filterCount =
    state.payments.length +
    (state.price ? 1 : 0) +
    (state.priceMin ? 1 : 0) +
    (state.priceMax ? 1 : 0) +
    (state.office ? 1 : 0) +
    (state.distance ? 1 : 0) +
    (state.stageGroup ? 1 : 0);
  const personCount = state.leads.length;
  const anyChip =
    Boolean(state.q) ||
    personCount > 0 ||
    filterCount > 0 ||
    state.sort !== "created" ||
    columnsChanged(state.hiddenColumns);

  const toggleLead = (name: string) => {
    const next = state.leads.includes(name) ? state.leads.filter((n) => n !== name) : [...state.leads, name];
    onChange({ leads: next });
  };

  const togglePayment = (value: string) => {
    const next = state.payments.includes(value)
      ? state.payments.filter((p) => p !== value)
      : [...state.payments, value];
    onChange({ payments: next });
  };

  const toggleHidden = (id: BoardColumnId) => {
    const next = state.hiddenColumns.includes(id)
      ? state.hiddenColumns.filter((c) => c !== id)
      : [...state.hiddenColumns, id];
    onChange({ hiddenColumns: next });
  };

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (state.q) chips.push({ key: "q", label: `Search: ${state.q}`, clear: () => onChange({ q: "" }) });
  for (const name of state.leads) {
    chips.push({ key: `lead-${name}`, label: `Lead: ${name}`, clear: () => toggleLead(name) });
  }
  for (const p of state.payments) {
    chips.push({
      key: `pay-${p}`,
      label: `Payment: ${p === "overdue" ? "Overdue" : PAYMENT_LABEL_TEXT[p as keyof typeof PAYMENT_LABEL_TEXT] ?? p}`,
      clear: () => togglePayment(p),
    });
  }
  if (state.price) chips.push({ key: "price", label: PRICE_BAND_LABELS[state.price as keyof typeof PRICE_BAND_LABELS] ?? state.price, clear: () => onChange({ price: "" }) });
  if (state.priceMin) chips.push({ key: "min", label: `Min R${state.priceMin}`, clear: () => onChange({ priceMin: "" }) });
  if (state.priceMax) chips.push({ key: "max", label: `Max R${state.priceMax}`, clear: () => onChange({ priceMax: "" }) });
  if (state.office) chips.push({ key: "office", label: OFFICE_FILTER_LABELS[state.office as keyof typeof OFFICE_FILTER_LABELS] ?? state.office, clear: () => onChange({ office: "" }) });
  if (state.distance) chips.push({ key: "dist", label: DISTANCE_BAND_LABELS[state.distance as keyof typeof DISTANCE_BAND_LABELS] ?? state.distance, clear: () => onChange({ distance: "" }) });
  if (state.stageGroup) chips.push({ key: "stage", label: GROUP_LABELS[state.stageGroup as ProjectGroup] ?? state.stageGroup, clear: () => onChange({ stageGroup: "" }) });

  return (
    <div className="ops-toolbar">
      <div className="ops-toolbar__row" role="toolbar" aria-label="Board tools">
        {canEdit ? (
          <button type="button" className="ops-toolbar__primary" onClick={onNewProject}>
            New project
          </button>
        ) : null}

        <div className={`ops-toolbar__search${searchOpen || state.q ? " is-open" : ""}`}>
          <button
            type="button"
            className="ops-toolbar__btn"
            aria-expanded={searchOpen || Boolean(state.q)}
            aria-controls={searchId}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <IconSearch />
            <span>Search</span>
          </button>
          <input
            id={searchId}
            ref={searchRef}
            className="ops-toolbar__search-input"
            type="search"
            value={state.q}
            placeholder="Search customer, site, QU or INV"
            onChange={(e) => onChange({ q: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                if (state.q) onChange({ q: "" });
                else setSearchOpen(false);
              }
            }}
          />
        </div>

        <button
          ref={personBtn}
          type="button"
          className={`ops-toolbar__btn${personCount ? " is-active" : ""}`}
          aria-expanded={open === "person"}
          onClick={() => setOpen((v) => (v === "person" ? null : "person"))}
        >
          <IconPerson />
          <span>Person</span>
          {personCount ? <span className="ops-toolbar__badge">{personCount}</span> : null}
        </button>

        <button
          ref={filterBtn}
          type="button"
          className={`ops-toolbar__btn${filterCount ? " is-active" : ""}`}
          aria-expanded={open === "filter"}
          onClick={() => setOpen((v) => (v === "filter" ? null : "filter"))}
        >
          <IconFilter />
          <span>Filter</span>
          <Chevron />
          {filterCount ? <span className="ops-toolbar__dot" aria-label={`${filterCount} filters`} /> : null}
        </button>

        <button
          ref={sortBtn}
          type="button"
          className={`ops-toolbar__btn${state.sort !== "created" ? " is-active" : ""}`}
          aria-expanded={open === "sort"}
          onClick={() => setOpen((v) => (v === "sort" ? null : "sort"))}
        >
          <IconSort />
          <span>Sort</span>
        </button>

        <button
          ref={hideBtn}
          type="button"
          className={`ops-toolbar__btn${columnsChanged(state.hiddenColumns) ? " is-active" : ""}`}
          aria-expanded={open === "hide"}
          onClick={() => setOpen((v) => (v === "hide" ? null : "hide"))}
        >
          <IconHide />
          <span>Hide</span>
        </button>

        <button
          ref={moreBtn}
          type="button"
          className="ops-toolbar__btn ops-toolbar__btn--icon"
          aria-label="More board actions"
          aria-expanded={open === "more"}
          onClick={() => setOpen((v) => (v === "more" ? null : "more"))}
        >
          <IconMore />
        </button>
      </div>

      {anyChip && chips.length ? (
        <div className="ops-toolbar__chips" aria-label="Active filters">
          {chips.map((chip) => (
            <button key={chip.key} type="button" className="ops-toolbar__chip" onClick={chip.clear}>
              {chip.label} <span aria-hidden="true">×</span>
            </button>
          ))}
          <button type="button" className="ops-toolbar__chip-clear" onClick={onClear}>
            Clear all
          </button>
        </div>
      ) : null}

      <ToolbarPopover open={open === "person"} anchorRef={personBtn} onClose={() => setOpen(null)}>
        <LeadList
          leads={leads}
          selected={state.leads}
          onToggle={toggleLead}
          editable={canEdit && savedLeads !== null}
          savedLeads={savedLeads ?? []}
          onRemoved={(name) => {
            if (state.leads.includes(name)) toggleLead(name);
          }}
        />
      </ToolbarPopover>

      <ToolbarPopover open={open === "filter"} anchorRef={filterBtn} onClose={() => setOpen(null)} width={320}>
        <p className="ops-toolbar__popover-title">Filter</p>
        <div className="ops-toolbar__form">
          <fieldset>
            <legend>Payment status</legend>
            <div className="ops-toolbar__chips-inline">
              {PAYMENT_LABELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`ops-toolbar__chip${state.payments.includes(l) ? " is-on" : ""}`}
                  onClick={() => togglePayment(l)}
                >
                  {PAYMENT_LABEL_TEXT[l]}
                </button>
              ))}
              <button
                type="button"
                className={`ops-toolbar__chip${state.payments.includes("overdue") ? " is-on" : ""}`}
                onClick={() => togglePayment("overdue")}
              >
                Overdue
              </button>
            </div>
          </fieldset>
          <label>
            Price band
            <select className="admin-select" value={state.price} onChange={(e) => onChange({ price: e.target.value })}>
              <option value="">Any</option>
              {PRICE_BANDS.map((b) => (
                <option key={b} value={b}>
                  {PRICE_BAND_LABELS[b]}
                </option>
              ))}
            </select>
          </label>
          <div className="ops-toolbar__pair">
            <label>
              Min R
              <input className="admin-input" type="number" min={0} step={1000} value={state.priceMin} onChange={(e) => onChange({ priceMin: e.target.value })} />
            </label>
            <label>
              Max R
              <input className="admin-input" type="number" min={0} step={1000} value={state.priceMax} onChange={(e) => onChange({ priceMax: e.target.value })} />
            </label>
          </div>
          <label>
            Stage
            <select className="admin-select" value={state.stageGroup} onChange={(e) => onChange({ stageGroup: e.target.value })}>
              <option value="">All stages</option>
              {PROJECT_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {GROUP_LABELS[g]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Distance
            <select className="admin-select" value={state.distance} onChange={(e) => onChange({ distance: e.target.value })}>
              <option value="">Any distance</option>
              {DISTANCE_BANDS.map((b) => (
                <option key={b} value={b}>
                  {DISTANCE_BAND_LABELS[b]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nearest office
            <select className="admin-select" value={state.office} onChange={(e) => onChange({ office: e.target.value })}>
              <option value="">Any</option>
              {OFFICE_FILTERS.map((o) => (
                <option key={o} value={o}>
                  {OFFICE_FILTER_LABELS[o]}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="ops-toolbar__text-btn" onClick={onClear}>
            Clear all
          </button>
        </div>
      </ToolbarPopover>

      <ToolbarPopover open={open === "sort"} anchorRef={sortBtn} onClose={() => setOpen(null)} width={220}>
        <p className="ops-toolbar__popover-title">Sort by</p>
        <ul className="ops-toolbar__radio-list">
          {(
            [
              ["name", "Project"],
              ["price", "Value"],
              ["distance", "Distance"],
              ["created", "Created"],
            ] as const
          ).map(([value, label]) => (
            <li key={value}>
              <label>
                <input
                  type="radio"
                  name="ops-sort"
                  checked={state.sort === value}
                  onChange={() => onChange({ sort: value })}
                />
                {label}
              </label>
            </li>
          ))}
        </ul>
        <div className="ops-toolbar__pair" style={{ marginTop: 8 }}>
          <button type="button" className={`ops-toolbar__chip${state.sortDir === "asc" ? " is-on" : ""}`} onClick={() => onChange({ sortDir: "asc" })}>
            Asc
          </button>
          <button type="button" className={`ops-toolbar__chip${state.sortDir === "desc" ? " is-on" : ""}`} onClick={() => onChange({ sortDir: "desc" })}>
            Desc
          </button>
        </div>
      </ToolbarPopover>

      <ToolbarPopover open={open === "hide"} anchorRef={hideBtn} onClose={() => setOpen(null)} width={200}>
        <p className="ops-toolbar__popover-title">Hide columns</p>
        <ul className="ops-toolbar__check-list">
          {BOARD_COLUMNS.map((col) => (
            <li key={col.id}>
              <label>
                <input type="checkbox" checked={state.hiddenColumns.includes(col.id)} onChange={() => toggleHidden(col.id)} />
                {col.label}
              </label>
            </li>
          ))}
        </ul>
      </ToolbarPopover>

      <ToolbarPopover open={open === "more"} anchorRef={moreBtn} onClose={() => setOpen(null)} width={200}>
        <ul className="ops-toolbar__menu-list">
          <li>
            <button type="button" onClick={() => { onExpandAll(); setOpen(null); }}>
              Expand all
            </button>
          </li>
          <li>
            <button type="button" onClick={() => { onCollapseAll(); setOpen(null); }}>
              Collapse all
            </button>
          </li>
          <li>
            <button type="button" onClick={() => { onToggleFreeze(); setOpen(null); }}>
              {frozen ? "Unfreeze columns" : "Freeze columns"}
            </button>
          </li>
          <li>
            <button type="button" onClick={() => { onExportCsv(); setOpen(null); }}>
              Export CSV
            </button>
          </li>
        </ul>
      </ToolbarPopover>
    </div>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5M7 7v4M9 7v4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Person menu: filter by lead, and (for editors) add or remove names on the saved list. */
function LeadList({
  leads,
  selected,
  onToggle,
  editable,
  savedLeads,
  onRemoved,
}: {
  leads: string[];
  selected: string[];
  onToggle: (name: string) => void;
  editable: boolean;
  savedLeads: string[];
  onRemoved: (name: string) => void;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const saved = new Set(savedLeads.map((n) => n.toLowerCase()));

  const add = async () => {
    if (busy) return;
    setBusy("+");
    setMessage(null);
    const r = await addProjectLeadAction(draft);
    setBusy(null);
    if ("error" in r) return setMessage(r.error);
    setDraft("");
    setAdding(false);
    router.refresh();
  };

  const remove = async (name: string) => {
    if (busy || !window.confirm(`Remove ${name} from the list? Projects are not changed.`)) return;
    setBusy(name);
    setMessage(null);
    const r = await deleteProjectLeadAction(name);
    setBusy(null);
    if ("error" in r) return setMessage(r.error);
    onRemoved(name);
    router.refresh();
  };

  return (
    <>
      <div className="ops-toolbar__popover-head">
        <p className="ops-toolbar__popover-title">Project lead</p>
        {editable ? (
          <button type="button" className="ops-toolbar__icon-btn" aria-label="Add a project lead" title="Add a project lead" onClick={() => setAdding((v) => !v)}>
            <IconPlus />
          </button>
        ) : null}
      </div>
      {adding ? (
        <form
          className="ops-toolbar__lead-add"
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <input className="admin-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Name" aria-label="New project lead" maxLength={80} autoFocus />
          <button type="submit" className="admin-btn admin-btn--primary admin-btn--sm" disabled={busy === "+" || !draft.trim()}>
            Add
          </button>
        </form>
      ) : null}
      <ul className="ops-toolbar__check-list">
        {leads.length === 0 ? <li className="ops-table__meta">No leads yet</li> : null}
        {leads.map((name) => (
          <li key={name} className="ops-toolbar__lead-row">
            <label>
              <input type="checkbox" checked={selected.includes(name)} onChange={() => onToggle(name)} />
              {name}
            </label>
            {editable && saved.has(name.toLowerCase()) ? (
              <button type="button" className="ops-toolbar__icon-btn ops-toolbar__icon-btn--danger" aria-label={`Remove ${name}`} title={`Remove ${name}`} disabled={busy === name} onClick={() => void remove(name)}>
                <IconTrash />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {message ? <p className="ops-toolbar__lead-msg" role="alert">{message}</p> : null}
    </>
  );
}
