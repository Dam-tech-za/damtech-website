"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { updateBoardFieldAction } from "@/app/admin/operations/board-field-actions";
import { SA_TOWNS } from "@/lib/operations/sa-places";
import { displayPhone } from "@/lib/operations/phone-display";
import { CountryFlag } from "./CountryFlag";
import type { BoardProject } from "@/lib/operations/queries";
import { formatOpsMoney } from "./ops-format";
import { KIND_LABELS } from "@/lib/operations/project-money";


type SaveFn = (field: string, value: string, extra?: string) => Promise<boolean>;

function useCellSave(projectId: string): SaveFn {
  return async (field, value, extra) => {
    const result = await updateBoardFieldAction({ id: projectId, field, value, extra });
    if (!result?.ok) {
      window.alert(result?.message || "Could not save.");
      return false;
    }
    return true;
  };
}

function SavedTick({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="ops-cell__saved" aria-live="polite">
      ✓
    </span>
  );
}

function focusNextCell(from: HTMLElement, dir: 1 | -1) {
  const row = from.closest("tr");
  if (!row) return;
  const cells = [...row.querySelectorAll<HTMLElement>("[data-ops-cell]")];
  const i = cells.indexOf(from);
  if (i < 0) return;
  const next = cells[i + dir];
  if (!next) return;
  next.focus();
  if (next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement) {
    const len = next.value.length;
    try {
      next.setSelectionRange(dir === 1 ? 0 : len, dir === 1 ? 0 : len);
    } catch {
      // Some input types reject selection.
    }
  }
}

/** Always-visible transparent text field — click places the caret natively. */
function InlineText({
  value,
  displayValue,
  placeholder,
  title,
  maxLength,
  listId,
  className,
  ariaLabel,
  inputMode,
  wrap = false,
  onCommit,
  onCancelValue,
}: {
  value: string;
  /** When set and not focused, show this instead of `value` (e.g. formatted money/phone). */
  displayValue?: string;
  placeholder: string;
  title?: string;
  maxLength?: number;
  listId?: string;
  className?: string;
  ariaLabel: string;
  inputMode?: "text" | "decimal" | "email" | "tel";
  /** Show long text on up to two lines while not editing (inputs cannot wrap). */
  wrap?: boolean;
  onCommit: (next: string) => Promise<boolean>;
  onCancelValue: string;
}) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const [saved, setSaved] = useState(false);
  const [source, setSource] = useState(value);
  const saving = useRef(false);

  // Keep draft in sync when the parent row patches after save / filter refresh.
  if (!focused && value !== source) {
    setSource(value);
    setDraft(value);
  }

  const shown = focused ? draft : (displayValue ?? draft);

  const commit = async () => {
    if (saving.current) return;
    saving.current = true;
    const ok = await onCommit(draft);
    saving.current = false;
    if (ok) {
      setSource(draft);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1000);
    } else {
      setDraft(source);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDraft(onCancelValue);
      setSource(onCancelValue);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Tab") {
      // Let blur save, then move within the row.
      const el = e.currentTarget;
      window.setTimeout(() => focusNextCell(el, e.shiftKey ? -1 : 1), 0);
    }
  };

  return (
    <span className={`ops-inline ${className ?? ""}${wrap ? " ops-inline--wrap" : ""}`}>
      {wrap && !focused ? (
        <span className={`ops-inline__wrapped${shown ? "" : " is-empty"}`} aria-hidden="true">
          {shown || placeholder}
        </span>
      ) : null}
      <input
        data-ops-cell
        className={`ops-inline-input${focused ? " is-focused" : ""}`}
        value={shown}
        title={title}
        placeholder={placeholder}
        maxLength={maxLength}
        list={listId}
        aria-label={ariaLabel}
        inputMode={inputMode}
        onFocus={() => {
          setFocused(true);
          setDraft(value);
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setFocused(false);
          void commit();
        }}
        onKeyDown={onKeyDown}
      />
      <SavedTick show={saved} />
    </span>
  );
}

export function TitleCell({
  project,
  onPeek,
  onPatched,
  canEdit,
}: {
  project: BoardProject;
  onPeek: () => void;
  onPatched?: (p: BoardProject) => void;
  canEdit: boolean;
}) {
  const save = useCellSave(project.id);
  if (!canEdit) {
    return (
      <span className="ops-table__title" title={project.title}>
        {project.title}
      </span>
    );
  }
  return (
    <div className="ops-title-cell">
      <InlineText
        value={project.title}
        placeholder="+ Project"
        title={project.title}
        maxLength={200}
        ariaLabel={`Project name for ${project.title}`}
        className="ops-inline--title"
        onCancelValue={project.title}
        onCommit={async (next) => {
          const ok = await save("title", next);
          if (ok) onPatched?.({ ...project, title: next.trim() || "Untitled project" });
          return ok;
        }}
      />
      <button type="button" className="ops-title-cell__peek" aria-label="Open quick view" title="Quick view" onClick={onPeek}>
        ▸
      </button>
    </div>
  );
}

export function LeadCell({
  project,
  suggestions,
  canEdit,
  onPatched,
}: {
  project: BoardProject;
  suggestions: string[];
  canEdit: boolean;
  onPatched?: (p: BoardProject) => void;
}) {
  const save = useCellSave(project.id);
  const [saving, setSaving] = useState(false);
  if (!canEdit) return <span>{project.leadName || "—"}</span>;
  // Only names on the Person list can be picked. An older lead typed by hand
  // stays visible (marked) until someone chooses from the list.
  const current = project.leadName ?? "";
  const offList = Boolean(current) && !suggestions.some((s) => s.toLowerCase() === current.toLowerCase());
  return (
    <select
      className="ops-cell__select"
      data-ops-cell
      value={current}
      disabled={saving}
      aria-label={`Lead for ${project.title}`}
      title={offList ? `${current} is not on the Person list` : current || undefined}
      onChange={async (e) => {
        const next = e.target.value;
        setSaving(true);
        const ok = await save("lead", next);
        setSaving(false);
        if (ok) onPatched?.({ ...project, leadName: next || null, project_lead_name: next || null });
      }}
    >
      <option value="">{current ? "No lead" : "+ Lead"}</option>
      {offList ? <option value={current}>{current} (not on list)</option> : null}
      {suggestions.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

export { PaymentEditCell } from "./PaymentEditCell";

/** Small building mark for the customer line. */
function OrgIcon() {
  return (
    <svg className="ops-client__org-icon" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
      <path d="M3 14V3.5L9 2v12M9 6h4v8M2 14h12M5 5.5h2M5 8h2M5 10.5h2M11 8.5h0.01M11 11h0.01" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ClientEditCell({
  project,
  canEdit,
  onPatched,
}: {
  project: BoardProject;
  canEdit: boolean;
  onPatched?: (p: BoardProject) => void;
}) {
  const save = useCellSave(project.id);
  const shown = displayPhone(project.contact_phone);
  // The customer (company or farm) sits under the contact person and phone, unless it is the same name.
  const company = project.customer_name?.trim() ?? "";
  const showCompany = Boolean(company) && company.toLowerCase() !== (project.contact_person ?? "").trim().toLowerCase();
  const gridClass = `ops-client--grid${showCompany ? " ops-client--with-company" : ""}`;

  if (!canEdit) {
    return (
      <span className={`ops-client ${gridClass}`}>
        <span className="ops-client__flagcol">
          <CountryFlag country={shown?.country} />
        </span>
        <span className="ops-client__name">{project.contact_person || "—"}</span>
        {shown ? (
          <a className="ops-client__phone" href={shown.href}>
            {shown.text}
          </a>
        ) : (
          <span className="ops-table__meta ops-client__phone">—</span>
        )}
        {showCompany ? (
          <span className="ops-client__org" title={company}>
            <OrgIcon />
            <span className="ops-client__org-name">{company}</span>
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className={`ops-client ops-client--edit ${gridClass}`}>
      <span className="ops-client__flagcol">
        <CountryFlag country={shown?.country} />
      </span>
      <InlineText
        value={project.contact_person ?? ""}
        placeholder="+ Client"
        maxLength={200}
        ariaLabel={`Client name for ${project.title}`}
        className="ops-inline--name"
        onCancelValue={project.contact_person ?? ""}
        onCommit={async (next) => {
          const ok = await save("client", next);
          if (ok) onPatched?.({ ...project, contact_person: next.trim() || null });
          return ok;
        }}
      />
      <span className="ops-inline-phone">
        <InlineText
          value={project.contact_phone ?? ""}
          displayValue={shown?.text}
          placeholder="+ Phone"
          maxLength={40}
          inputMode="tel"
          ariaLabel={`Phone for ${project.title}`}
          className="ops-inline--phone"
          onCancelValue={project.contact_phone ?? ""}
          onCommit={async (next) => {
            const ok = await save("phone", next);
            if (ok) onPatched?.({ ...project, contact_phone: next.trim() || null });
            return ok;
          }}
        />
      </span>
      {showCompany ? (
        <span className="ops-client__org" title={company}>
          <OrgIcon />
          <InlineText
            value={company}
            placeholder="+ Company"
            maxLength={200}
            ariaLabel={`Customer for ${project.title}`}
            className="ops-inline--company"
            onCancelValue={company}
            onCommit={async (next) => {
              const ok = await save("company", next);
              if (ok) onPatched?.({ ...project, customer_name: next.trim() });
              return ok;
            }}
          />
        </span>
      ) : null}
    </span>
  );
}

export function EmailEditCell({
  project,
  canEdit,
  onPatched,
}: {
  project: BoardProject;
  canEdit: boolean;
  onPatched?: (p: BoardProject) => void;
}) {
  const save = useCellSave(project.id);
  const email = project.contact_email?.trim() || "";

  if (!canEdit) {
    return email ? (
      <a className="ops-email-link" href={`mailto:${email}`}>
        {email}
      </a>
    ) : (
      <span className="ops-table__meta">—</span>
    );
  }

  return (
    <InlineText
      value={email}
      placeholder="+ Email"
      maxLength={200}
      inputMode="email"
      title={email || undefined}
      ariaLabel={`Email for ${project.title}`}
      className="ops-inline--email"
      onCancelValue={email}
      onCommit={async (next) => {
        const ok = await save("email", next);
        if (ok) onPatched?.({ ...project, contact_email: next.trim() || null });
        return ok;
      }}
    />
  );
}

export function XeroEditCell({
  project,
  canEdit,
  onPatched,
}: {
  project: BoardProject;
  canEdit: boolean;
  onPatched?: (p: BoardProject) => void;
}) {
  const numbers = [...(project.xero_quote_numbers ?? []), ...(project.xero_invoice_numbers ?? [])].filter(Boolean);
  const joined = numbers.join(", ");
  // Tooltip: the quote first, then each invoice with its kind, status and total.
  const kindOf = new Map((project.payment?.kinds ?? []).map((k) => [k.invoice_number, k]));
  const detail = [
    ...(project.xero_quote_numbers ?? []).map((q, i) => `${q} quote${i === 0 ? " (primary)" : ""}${i === 0 && project.quoted_total_incl_vat !== null ? ` ${formatOpsMoney(project.quoted_total_incl_vat)}` : ""}`),
    ...(project.xero_invoice_numbers ?? []).map((n) => {
      const k = kindOf.get(n);
      return k ? `${n} ${KIND_LABELS[k.kind]} · ${k.xero_status.toLowerCase()} ${formatOpsMoney(k.total)}` : n;
    }),
  ].join("\n");
  const display =
    numbers.length <= 1 ? joined : `${numbers[0]} +${numbers.length - 1}`;
  const save = useCellSave(project.id);

  if (!canEdit) return <span title={detail || joined}>{display || "—"}</span>;

  return (
    <InlineText
      value={joined}
      displayValue={display}
      placeholder="+ Xero"
      title={detail || joined || undefined}
      ariaLabel={`Xero numbers for ${project.title}`}
      onCancelValue={joined}
      onCommit={async (next) => {
        const ok = await save("xero", next);
        if (ok) {
          const parts = next
            .split(/[,;\s]+/)
            .map((p) => p.trim().toUpperCase())
            .filter(Boolean);
          onPatched?.({
            ...project,
            xero_quote_numbers: parts.filter((p) => p.startsWith("QU") || p.startsWith("QT")),
            xero_invoice_numbers: parts.filter((p) => p.startsWith("INV")),
          });
        }
        return ok;
      }}
    />
  );
}

export function ValueEditCell({
  project,
  canEdit,
  onPatched,
}: {
  project: BoardProject;
  canEdit: boolean;
  onPatched?: (p: BoardProject) => void;
}) {
  const raw = project.quoted_total_incl_vat == null ? "" : String(project.quoted_total_incl_vat);
  const save = useCellSave(project.id);
  if (!canEdit) return <>{formatOpsMoney(project.quoted_total_incl_vat)}</>;

  return (
    <InlineText
      value={raw}
      displayValue={formatOpsMoney(project.quoted_total_incl_vat) === "—" ? "" : formatOpsMoney(project.quoted_total_incl_vat)}
      placeholder="+ Value"
      inputMode="decimal"
      ariaLabel={`Value for ${project.title}`}
      onCancelValue={raw}
      onCommit={async (next) => {
        const ok = await save("value", next);
        if (ok) {
          const cleaned = next.trim().replace(/[\sR,]/gi, "");
          onPatched?.({
            ...project,
            quoted_total_incl_vat: cleaned ? Number(cleaned) : null,
            quoted_total_manual: true,
          });
        }
        return ok;
      }}
    />
  );
}

export function LocationEditCell({
  project,
  canEdit,
  display,
  km,
  full,
  onPatched,
}: {
  project: BoardProject;
  canEdit: boolean;
  display: string | null;
  /** Distance to the nearer office, shown on a second line. */
  km?: string | null;
  /** Longer text for the tooltip (province, office). */
  full?: string | null;
  onPatched?: (p: BoardProject) => void;
}) {
  const listId = useId();
  const save = useCellSave(project.id);
  const editValue =
    project.site_province && project.site_town
      ? `${project.site_province}, ${project.site_town}`
      : project.site_location || "";
  const suggestions = SA_TOWNS.map((t) => `${t.province}, ${t.name}`);

  const distance = km ? <span className="ops-location__km">{km}</span> : null;
  if (!canEdit)
    return (
      <span className="ops-location" title={full ?? display ?? undefined}>
        <span>{display || "—"}</span>
        {distance}
      </span>
    );

  return (
    <span className="ops-location">
      <InlineText
        value={editValue}
        displayValue={display ?? ""}
        placeholder="+ Location"
        wrap
        title={full ?? display ?? undefined}
        listId={listId}
        ariaLabel={`Location for ${project.title}`}
        onCancelValue={editValue}
        onCommit={async (next) => {
          const town = SA_TOWNS.find((t) => `${t.province}, ${t.name}`.toLowerCase() === next.trim().toLowerCase());
          const extra = town ? `${town.lat},${town.lng},` : undefined;
          const ok = await save("location", next, extra);
          if (ok) onPatched?.({ ...project, site_location: next.trim() || null });
          return ok;
        }}
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {distance}
    </span>
  );
}

export function ReadonlyCell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
