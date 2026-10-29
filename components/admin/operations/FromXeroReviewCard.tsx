"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  applyFromXeroAction,
  previewFromXeroAction,
  undoFromXeroLogAction,
} from "@/app/admin/operations/xero-review-actions";
import { displayPhone } from "@/lib/operations/phone-display";
import type { ReviewPreview, ReviewRow } from "@/lib/operations/xero-review";
import type { BoardProject } from "@/lib/operations/queries";

type RowState = {
  row: ReviewRow;
  value: string;
  accept: boolean;
};

type Props = {
  project: BoardProject;
  open: boolean;
  onClose: () => void;
  onApplied: (patch: Partial<BoardProject>, message: string, undo: (() => Promise<void>) | null) => void;
};

function formatCurrent(field: string, value: string): string {
  if (field === "contact_phone" && value) {
    const shown = displayPhone(value);
    return shown ? `${shown.flag ? `${shown.flag} ` : ""}${shown.text}` : value;
  }
  return value || "—";
}

export function FromXeroReviewCard({ project, open, onClose, onApplied }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [needsDoc, setNeedsDoc] = useState(false);
  const [docInput, setDocInput] = useState("");
  const [preview, setPreview] = useState<ReviewPreview | null>(null);
  const [rows, setRows] = useState<RowState[]>([]);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const applyPreview = (result: Awaited<ReturnType<typeof previewFromXeroAction>>) => {
    if (!result.ok) {
      setError(result.error);
      setNeedsDoc(Boolean(result.needsDocument));
      setPreview(null);
      setRows([]);
      return;
    }
    setNeedsDoc(false);
    setError(null);
    setPreview(result.preview);
    setRows(
      result.preview.rows.map((row) => ({
        row,
        value: row.proposed,
        accept: row.defaultAccept,
      })),
    );
  };

  const load = (documentNumber?: string) => {
    startTransition(async () => {
      applyPreview(await previewFromXeroAction(project.id, documentNumber));
    });
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    startTransition(async () => {
      const result = await previewFromXeroAction(project.id);
      if (!cancelled) applyPreview(result);
    });
    return () => {
      cancelled = true;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, project.id]);

  if (!open || typeof document === "undefined") return null;

  const acceptedCount = rows.filter((r) => r.accept && r.value.trim()).length;

  const rejectAll = () => setRows((current) => current.map((r) => ({ ...r, accept: false })));

  const onFind = (e: FormEvent) => {
    e.preventDefault();
    load(docInput.trim());
  };

  const onAcceptUpdates = () => {
    if (!preview || !acceptedCount) return;
    startTransition(async () => {
      const result = await applyFromXeroAction({
        projectId: project.id,
        documentNumber: preview.documentNumber,
        contactId: preview.contactId,
        accepted: rows.filter((r) => r.accept).map((r) => ({ field: r.row.field, value: r.value })),
      });
      if (!result || !("ok" in result) || !result.ok || !("patch" in result)) {
        setError(("message" in (result ?? {}) && result && "message" in result ? String(result.message) : null) || "Update failed.");
        return;
      }
      const logId = result.logId;
      onApplied(result.patch as Partial<BoardProject>, result.message, logId
        ? async () => {
            await undoFromXeroLogAction(logId);
          }
        : null);
      onClose();
    });
  };

  return createPortal(
    <div
      className="ops-xero-review"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ops-xero-review__card" role="dialog" aria-modal="true" aria-labelledby="ops-xero-review-title">
        <header className="ops-xero-review__head">
          <h2 id="ops-xero-review-title">Update from Xero</h2>
          <p className="ops-xero-review__sub">{project.title}</p>
        </header>

        {pending && !preview && !error ? <p className="ops-xero-review__status">Contacting Xero…</p> : null}
        {error ? <p className="ops-xero-review__error">{error}</p> : null}

        {needsDoc || (error && /No Xero quote or invoice/i.test(error)) ? (
          <form className="ops-xero-review__find" onSubmit={onFind}>
            <label>
              Xero number
              <input
                className="admin-input"
                value={docInput}
                onChange={(e) => setDocInput(e.target.value)}
                placeholder="QU0348 or INV0159"
                maxLength={20}
                autoFocus
              />
            </label>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={pending || !docInput.trim()}>
              Find
            </button>
          </form>
        ) : null}

        {preview ? (
          <>
            <p className="ops-xero-review__doc">
              From <strong>{preview.documentNumber}</strong>
              {preview.matchCount > 0 ? (
                <span className="ops-xero-review__match"> · {preview.matchCount} field{preview.matchCount === 1 ? "" : "s"} already match</span>
              ) : null}
            </p>
            {rows.length === 0 ? (
              <p className="ops-xero-review__status">Everything already matches Xero.</p>
            ) : (
              <div className="ops-xero-review__table" role="table">
                <div className="ops-xero-review__tr ops-xero-review__tr--head" role="row">
                  <span role="columnheader">Field</span>
                  <span role="columnheader">Ours</span>
                  <span role="columnheader">From Xero</span>
                  <span role="columnheader"> </span>
                </div>
                {rows.map((r, idx) => (
                  <div key={r.row.field} className="ops-xero-review__tr" role="row">
                    <span role="cell" className="ops-xero-review__label">
                      {r.row.label}
                    </span>
                    <span role="cell" className="ops-xero-review__current">
                      {formatCurrent(r.row.field, r.row.current)}
                    </span>
                    <span role="cell">
                      <input
                        className="admin-input ops-xero-review__input"
                        value={r.value}
                        onChange={(e) =>
                          setRows((current) => current.map((row, i) => (i === idx ? { ...row, value: e.target.value } : row)))
                        }
                        aria-label={`${r.row.label} from Xero`}
                      />
                    </span>
                    <span role="cell" className="ops-xero-review__toggles">
                      <button
                        type="button"
                        className={`ops-xero-review__toggle${r.accept ? " is-on" : ""}`}
                        aria-pressed={r.accept}
                        title="Accept"
                        onClick={() => setRows((current) => current.map((row, i) => (i === idx ? { ...row, accept: true } : row)))}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        className={`ops-xero-review__toggle${!r.accept ? " is-off" : ""}`}
                        aria-pressed={!r.accept}
                        title="Reject"
                        onClick={() => setRows((current) => current.map((row, i) => (i === idx ? { ...row, accept: false } : row)))}
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}

        <footer className="ops-xero-review__foot">
          <button type="button" className="ops-xero-review__text" onClick={rejectAll} disabled={!rows.length}>
            Reject all
          </button>
          <button type="button" className="admin-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={pending || !acceptedCount}
            onClick={onAcceptUpdates}
          >
            Accept updates
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
