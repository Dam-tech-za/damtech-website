"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { updateBoardFieldAction } from "@/app/admin/operations/board-field-actions";
import { PAYMENT_LABELS, PAYMENT_LABEL_TEXT, type PaymentLabel } from "@/lib/operations/board";
import { SA_TOWNS } from "@/lib/operations/sa-places";
import { displayPhone } from "@/lib/operations/phone-display";
import type { BoardProject } from "@/lib/operations/queries";
import { formatOpsMoney } from "./ops-format";
import { PaymentPictureBadge } from "./PaymentPictureBadge";

type SaveFn = (field: string, value: string, extra?: string) => Promise<boolean>;

function useCellSave(projectId: string, onPatched?: (patch: Partial<BoardProject>) => void): SaveFn {
  return async (field, value, extra) => {
    const result = await updateBoardFieldAction({ id: projectId, field, value, extra });
    if (!result?.ok) {
      window.alert(result?.message || "Could not save.");
      return false;
    }
    onPatched?.({});
    return true;
  };
}

function SavedTick({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="ops-cell__saved" aria-live="polite">
      Saved
    </span>
  );
}

function CellShell({
  display,
  title,
  editing,
  onStart,
  children,
  className,
  multiline,
}: {
  display: ReactNode;
  title?: string;
  editing: boolean;
  onStart: () => void;
  children: ReactNode;
  className?: string;
  multiline?: boolean;
}) {
  if (editing) return <div className={`ops-cell ops-cell--editing ${className ?? ""}`}>{children}</div>;
  return (
    <button
      type="button"
      className={`ops-cell ops-cell--btn ${multiline ? "ops-cell--multi" : ""} ${className ?? ""}`}
      title={title}
      onClick={onStart}
    >
      {display}
    </button>
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(project.title);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const save = useCellSave(project.id);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!canEdit) {
    return <span className="ops-table__title" title={project.title}>{project.title}</span>;
  }

  const commit = async () => {
    const ok = await save("title", draft);
    if (ok) {
      onPatched?.({ ...project, title: draft.trim() || "Untitled project" });
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
      setEditing(false);
    }
  };

  return (
    <div className="ops-title-cell">
      <CellShell
        editing={editing}
        onStart={() => {
          setDraft(project.title);
          setEditing(true);
        }}
        title={project.title}
        display={<span className="ops-table__title ops-title-cell__text">{project.title}</span>}
        multiline
      >
        <input
          ref={inputRef}
          className="admin-input ops-cell__input"
          value={draft}
          maxLength={200}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void commit();
            }
            if (e.key === "Escape") {
              setDraft(project.title);
              setEditing(false);
            }
          }}
        />
      </CellShell>
      <button type="button" className="ops-title-cell__peek" aria-label="Open quick view" title="Quick view" onClick={onPeek}>
        ▸
      </button>
      <SavedTick show={saved} />
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(project.leadName ?? "");
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const save = useCellSave(project.id);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!canEdit) return <span>{project.leadName || "—"}</span>;

  const commit = async () => {
    const ok = await save("lead", draft);
    if (ok) {
      onPatched?.({ ...project, leadName: draft.trim() || null, project_lead_name: draft.trim() || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
      setEditing(false);
    }
  };

  return (
    <>
      <CellShell
        editing={editing}
        onStart={() => {
          setDraft(project.leadName ?? "");
          setEditing(true);
        }}
        title={project.leadName ?? "Add lead"}
        display={project.leadName || <span className="ops-table__meta">+ Lead</span>}
      >
        <input
          ref={inputRef}
          className="admin-input ops-cell__input"
          list={listId}
          value={draft}
          maxLength={120}
          placeholder="Arno, Andre…"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void commit();
            }
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </CellShell>
      <SavedTick show={saved} />
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
  if (!canEdit) return <PaymentPictureBadge payment={project.payment} />;

  return (
    <div className="ops-pay-edit">
      <select
        className="admin-select ops-cell__select"
        aria-label={`Payment for ${project.title}`}
        value={project.payment.label ?? ""}
        onChange={(e) => {
          const next = e.target.value;
          void (async () => {
            const ok = await save("payment", next);
            if (ok) {
              onPatched?.({
                ...project,
                payment: {
                  ...project.payment,
                  label: (next || null) as PaymentLabel | null,
                },
                payment_label_override: next || null,
              });
            }
          })();
        }}
      >
        <option value="">—</option>
        {PAYMENT_LABELS.map((l) => (
          <option key={l} value={l}>
            {PAYMENT_LABEL_TEXT[l]}
          </option>
        ))}
      </select>
      {project.payment.overdue ? <span className="ops-pay__overdue" aria-label="Overdue" title="Overdue" /> : null}
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
  const [mode, setMode] = useState<"idle" | "name" | "phone">("idle");
  const [name, setName] = useState(project.contact_person ?? "");
  const [phone, setPhone] = useState(project.contact_phone ?? "");
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
        ) : null}
      </span>
    );
  }

  if (mode === "name") {
    return (
      <input
        className="admin-input ops-cell__input"
        autoFocus
        value={name}
        maxLength={200}
        placeholder="Client name"
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          void (async () => {
            const ok = await save("client", name);
            if (ok) onPatched?.({ ...project, contact_person: name.trim() || null });
            setMode("idle");
          })();
        }}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setMode("idle");
        }}
      />
    );
  }

  if (mode === "phone") {
    return (
      <input
        className="admin-input ops-cell__input"
        autoFocus
        value={phone}
        maxLength={40}
        placeholder="083…"
        onChange={(e) => setPhone(e.target.value)}
        onBlur={() => {
          void (async () => {
            const ok = await save("phone", phone);
            if (ok) onPatched?.({ ...project, contact_phone: phone.trim() || null });
            setMode("idle");
          })();
        }}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setMode("idle");
        }}
      />
    );
  }

  return (
    <span className="ops-client ops-client--edit">
      <button
        type="button"
        className="ops-cell--btn ops-client__name"
        onClick={() => {
          setName(project.contact_person ?? "");
          setMode("name");
        }}
      >
        {project.contact_person || <span className="ops-table__meta">+ Client</span>}
      </button>
      <button
        type="button"
        className="ops-cell--btn ops-client__phone"
        onClick={() => {
          setPhone(project.contact_phone ?? "");
          setMode("phone");
        }}
      >
        {shown ? (
          <>
            {shown.flag ? <span aria-hidden="true">{shown.flag}</span> : null} {shown.text}
          </>
        ) : (
          <span className="ops-table__meta">+ Phone</span>
        )}
      </button>
    </span>
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(numbers.join(", "));
  const save = useCellSave(project.id);

  const display =
    numbers.length === 0 ? (
      <span className="ops-table__meta">+ Xero</span>
    ) : numbers.length === 1 ? (
      numbers[0]
    ) : (
      <span className="ops-xero-cell" title={numbers.join(" · ")}>
        {numbers[0]} <span className="ops-xero-cell__more">+{numbers.length - 1}</span>
      </span>
    );

  if (!canEdit) return <>{display}</>;

  if (!editing) {
    return (
      <button
        type="button"
        className="ops-cell--btn"
        title={numbers.join(" · ") || "Add quote/invoice numbers"}
        onClick={() => {
          setDraft(numbers.join(", "));
          setEditing(true);
        }}
      >
        {display}
      </button>
    );
  }

  return (
    <input
      className="admin-input ops-cell__input"
      autoFocus
      value={draft}
      placeholder="QU0314, INV0143"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        void (async () => {
          const ok = await save("xero", draft);
          if (ok) {
            const parts = draft.split(/[,;\s]+/).map((p) => p.trim().toUpperCase()).filter(Boolean);
            onPatched?.({
              ...project,
              xero_quote_numbers: parts.filter((p) => p.startsWith("QU") || p.startsWith("QT")),
              xero_invoice_numbers: parts.filter((p) => p.startsWith("INV")),
            });
          }
          setEditing(false);
        })();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setEditing(false);
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(project.quoted_total_incl_vat == null ? "" : String(project.quoted_total_incl_vat));
  const save = useCellSave(project.id);

  if (!canEdit) return <>{formatOpsMoney(project.quoted_total_incl_vat)}</>;

  if (!editing) {
    return (
      <button
        type="button"
        className="ops-cell--btn"
        onClick={() => {
          setDraft(project.quoted_total_incl_vat == null ? "" : String(project.quoted_total_incl_vat));
          setEditing(true);
        }}
      >
        {formatOpsMoney(project.quoted_total_incl_vat)}
      </button>
    );
  }

  return (
    <input
      className="admin-input ops-cell__input"
      autoFocus
      inputMode="decimal"
      value={draft}
      placeholder="12345"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        void (async () => {
          const ok = await save("value", draft);
          if (ok) {
            const raw = draft.trim().replace(/[\sR,]/gi, "");
            onPatched?.({
              ...project,
              quoted_total_incl_vat: raw ? Number(raw) : null,
              quoted_total_manual: true,
            });
          }
          setEditing(false);
        })();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setEditing(false);
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(display ?? "");
  const save = useCellSave(project.id);
  const suggestions = SA_TOWNS.map((t) => `${t.province}, ${t.name}`);

  if (!canEdit) return <span title={display ?? undefined}>{display || "—"}</span>;

  if (!editing) {
    return (
      <button
        type="button"
        className="ops-cell--btn"
        title={display ?? "Add location"}
        onClick={() => {
          setDraft(
            project.site_province && project.site_town
              ? `${project.site_province}, ${project.site_town}`
              : project.site_location || "",
          );
          setEditing(true);
        }}
      >
        {display || <span className="ops-table__meta">+ Location</span>}
      </button>
    );
  }

  return (
    <>
      <input
        className="admin-input ops-cell__input"
        autoFocus
        list={listId}
        value={draft}
        placeholder="Province, Town"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          void (async () => {
            const town = SA_TOWNS.find((t) => `${t.province}, ${t.name}`.toLowerCase() === draft.trim().toLowerCase());
            const extra = town ? `${town.lat},${town.lng},` : undefined;
            const ok = await save("location", draft, extra);
            if (ok) {
              onPatched?.({
                ...project,
                site_location: draft.trim() || null,
              });
            }
            setEditing(false);
          })();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
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
