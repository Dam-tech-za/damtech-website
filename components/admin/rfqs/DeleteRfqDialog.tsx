"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { deleteRfqAction } from "@/app/admin/rfqs/actions/delete-rfq";
import { updateRfqStatusAction } from "@/app/admin/rfqs/actions";
import {
  RFQ_DELETE_REASONS,
  type RfqDeleteSummary,
} from "@/lib/admin/rfqs/delete-rfq";
import {
  AdminButton,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui";

type DeleteRfqDialogProps = {
  open: boolean;
  summary: RfqDeleteSummary | null;
  fromDetailPage?: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  onSuccess?: () => void;
};

export function DeleteRfqDialog({
  open,
  summary,
  fromDetailPage = false,
  returnFocusRef,
  onClose,
  onSuccess,
}: DeleteRfqDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState("");
  const [reasonOther, setReasonOther] = useState("");
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setReason("");
    setReasonOther("");
    setTypedConfirmation("");
    setDeleting(false);
    setClosing(false);
    setError(null);
    setBlocked(false);
    setIncidentId(null);
  }, []);

  const handleClose = useCallback(() => {
    if (deleting || closing) return;
    reset();
    onClose();
    returnFocusRef?.current?.focus();
  }, [closing, deleting, onClose, reset, returnFocusRef]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting && !closing) {
        event.preventDefault();
        handleClose();
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]',
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, deleting, closing, handleClose, returnFocusRef]);

  const canDelete =
    Boolean(summary) &&
    reason.length > 0 &&
    (reason !== "Other" || reasonOther.trim().length >= 3) &&
    typedConfirmation.trim() === summary?.rfqNumber.trim();

  async function handleDelete() {
    if (!summary || !canDelete || deleting) return;
    setDeleting(true);
    setError(null);
    setIncidentId(null);

    const result = await deleteRfqAction({
      rfqId: summary.id,
      reason,
      reasonOther: reason === "Other" ? reasonOther : undefined,
      typedConfirmation,
      fromDetailPage,
    });

    if (result.ok) {
      onSuccess?.();
      if (!fromDetailPage) {
        handleClose();
      }
      return;
    }

    setDeleting(false);
    if (result.blocked) {
      setBlocked(true);
    }
    setError(result.error);
    setIncidentId(result.incidentId ?? null);
  }

  if (!open || !summary || typeof document === "undefined") {
    return null;
  }

  const submittedLabel = new Date(summary.submittedAt).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return createPortal(
    <div className="admin-dialog admin-dialog--portal" role="presentation">
      <button
        type="button"
        className="admin-dialog__backdrop"
        aria-label="Close dialog"
        disabled={deleting || closing}
        onClick={handleClose}
      />
      <div
        ref={panelRef}
        className="admin-dialog__panel rfq-delete-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <header className="admin-dialog__header">
          <h2 id={titleId}>Delete RFQ?</h2>
        </header>

        <div className="admin-dialog__body">
          <p id={descriptionId} className="rfq-delete-dialog__lead">
            This action permanently removes the RFQ and any unquoted supporting
            records that belong only to this enquiry. This cannot be undone.
          </p>

          <dl className="rfq-delete-dialog__summary">
            <div>
              <dt>RFQ number</dt>
              <dd>{summary.rfqNumber}</dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>{summary.customerName}</dd>
            </div>
            {summary.companyName ? (
              <div>
                <dt>Company / farm</dt>
                <dd>{summary.companyName}</dd>
              </div>
            ) : null}
            <div>
              <dt>Service</dt>
              <dd>{summary.serviceLabel}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{submittedLabel}</dd>
            </div>
          </dl>

          <p className="rfq-delete-dialog__warning">
            RFQs linked to quotations, customer communications or protected
            business records cannot be deleted. Close or archive them instead.
          </p>

          <p className="rfq-delete-dialog__hint">
            Permanent deletion should generally be used only for spam, duplicates
            and test records.
          </p>

          {!blocked ? (
            <>
              <div className="form-field">
                <label htmlFor="rfq-delete-reason">Reason for deletion</label>
                <AdminSelect
                  id="rfq-delete-reason"
                  value={reason}
                  disabled={deleting}
                  onChange={(event) => setReason(event.target.value)}
                  required
                >
                  <option value="">Select a reason…</option>
                  {RFQ_DELETE_REASONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </AdminSelect>
              </div>

              {reason === "Other" ? (
                <div className="form-field">
                  <label htmlFor="rfq-delete-reason-other">Explanation</label>
                  <AdminTextarea
                    id="rfq-delete-reason-other"
                    rows={2}
                    value={reasonOther}
                    disabled={deleting}
                    onChange={(event) => setReasonOther(event.target.value)}
                    required
                  />
                </div>
              ) : null}

              <div className="form-field">
                <label htmlFor="rfq-delete-confirm">
                  Type the RFQ number to confirm:{" "}
                  <strong>{summary.rfqNumber}</strong>
                </label>
                <AdminInput
                  id="rfq-delete-confirm"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={typedConfirmation}
                  disabled={deleting}
                  onChange={(event) => setTypedConfirmation(event.target.value)}
                  placeholder={summary.rfqNumber}
                />
              </div>
            </>
          ) : null}

          {error ? (
            <p className="form-error" role="alert">
              {error}
              {incidentId ? ` Reference: ${incidentId}.` : null}
            </p>
          ) : null}
        </div>

        <footer className="admin-dialog__footer rfq-delete-dialog__footer">
          <AdminButton
            type="button"
            variant="secondary"
            disabled={deleting || closing}
            onClick={handleClose}
          >
            Cancel
          </AdminButton>

          {blocked ? (
            <form
              action={async (formData) => {
                if (closing) return;
                setClosing(true);
                setError(null);
                await updateRfqStatusAction(formData);
                setClosing(false);
                handleClose();
                onSuccess?.();
              }}
            >
              <input type="hidden" name="rfqId" value={summary.id} />
              <input type="hidden" name="status" value="closed" />
              <AdminButton
                type="submit"
                variant="primary"
                disabled={deleting || closing}
              >
                {closing ? "Closing…" : "Close RFQ instead"}
              </AdminButton>
            </form>
          ) : (
            <AdminButton
              ref={deleteButtonRef}
              type="button"
              variant="danger"
              disabled={!canDelete || deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting…" : "Delete RFQ"}
            </AdminButton>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
