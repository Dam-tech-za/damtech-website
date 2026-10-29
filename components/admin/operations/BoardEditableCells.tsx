"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { updateBoardFieldAction } from "@/app/admin/operations/board-field-actions";
import {
  PAYMENT_CELL_TONE,
  PAYMENT_LABELS,
  PAYMENT_LABEL_TEXT,
  type PaymentLabel,
} from "@/lib/operations/board";
import { SA_TOWNS } from "@/lib/operations/sa-places";
import { displayPhone } from "@/lib/operations/phone-display";
import type { BoardProject } from "@/lib/operations/queries";
import { formatOpsMoney } from "./ops-format";
import { PaymentPictureBadge } from "./PaymentPictureBadge";

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
    <span className={`ops-inline ${className ?? ""}`}>
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
  const listId = useId();
  const save = useCellSave(project.id);
  if (!canEdit) return <span>{project.leadName || "—"}</span>;
  return (
    <>
      <InlineText
        value={project.leadName ?? ""}
        placeholder="+ Lead"
        title={project.leadName ?? undefined}
        maxLength={120}
        listId={listId}
        ariaLabel={`Lead for ${project.title}`}
        onCancelValue={project.leadName ?? ""}
        onCommit={async (next) => {
          const ok = await save("lead", next);
          if (ok) onPatched?.({ ...project, leadName: next.trim() || null, project_lead_name: next.trim() || null });
          return ok;
        }}
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  );
}

export function PaymentEditCell({
  project,
  canEdit,
  onPatched,
}: {
  project: BoardProject;
  canEdit: boolean;
  onPatched?: (p: BoardProject) => void;
}) {
  const save = useCellSave(project.id);
  const [open, setOpen] = useState(false);
  if (!canEdit) return <PaymentPictureBadge payment={project.payment} />;

  const pick = (next: string) => {
    setOpen(false);
    void (async () => {
      const ok = await save("payment", next);
      if (ok) {
        onPatched?.({
          ...project,
          payment: { ...project.payment, label: (next || null) as PaymentLabel | null },
          payment_label_override: next || null,
        });
      }
    })();
  };

  return (
    <div className={`ops-pay-edit ops-pay-edit--cell${open ? " is-open" : ""}`}>
      <button
        type="button"
        data-ops-cell
        className="ops-pay-edit__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Payment for ${project.title}`}
        onClick={() => setOpen((v) => !v)}
      >
        <PaymentPictureBadge payment={project.payment} />
      </button>
      {open ? (
        <ul className="ops-pay-edit__menu" role="listbox">
          <li>
            <button
              type="button"
              role="option"
              className={`ops-pay ops-pay--cell ops-pay--empty${!project.payment.label ? " is-selected" : ""}`}
              aria-selected={!project.payment.label}
              onClick={() => pick("")}
            >
              <span className="ops-pay__text">Unset</span>
            </button>
          </li>
          {PAYMENT_LABELS.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                className={`ops-pay ops-pay--cell ${PAYMENT_CELL_TONE[l]}${project.payment.label === l ? " is-selected" : ""}`}
                aria-selected={project.payment.label === l}
                onClick={() => pick(l)}
              >
                <span className="ops-pay__text">{PAYMENT_LABEL_TEXT[l]}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
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

  if (!canEdit) {
    return (
      <span className="ops-client">
        <span className="ops-client__name">{project.contact_person || "—"}</span>
        {shown ? (
          <span className="ops-client__phone">
            {shown.flag ? <span aria-hidden="true">{shown.flag}</span> : null} {shown.text}
          </span>
        ) : (
          <span className="ops-table__meta">+ Phone</span>
        )}
      </span>
    );
  }

  return (
    <span className="ops-client ops-client--edit">
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
        {shown?.flag ? (
          <span className="ops-inline-phone__flag" aria-hidden="true">
            {shown.flag}
          </span>
        ) : null}
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
  const display =
    numbers.length <= 1 ? joined : `${numbers[0]} +${numbers.length - 1}`;
  const save = useCellSave(project.id);

  if (!canEdit) return <span title={joined}>{display || "—"}</span>;

  return (
    <InlineText
      value={joined}
      displayValue={display}
      placeholder="+ Xero"
      title={joined || undefined}
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
  onPatched,
}: {
  project: BoardProject;
  canEdit: boolean;
  display: string | null;
  onPatched?: (p: BoardProject) => void;
}) {
  const listId = useId();
  const save = useCellSave(project.id);
  const editValue =
    project.site_province && project.site_town
      ? `${project.site_province}, ${project.site_town}`
      : project.site_location || "";
  const suggestions = SA_TOWNS.map((t) => `${t.province}, ${t.name}`);

  if (!canEdit) return <span title={display ?? undefined}>{display || "—"}</span>;

  return (
    <>
      <InlineText
        value={editValue}
        displayValue={display ?? ""}
        placeholder="+ Location"
        title={display ?? undefined}
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
    </>
  );
}

export function ReadonlyCell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
