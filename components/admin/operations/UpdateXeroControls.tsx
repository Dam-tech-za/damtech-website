"use client";

import { useEffect, useState, useTransition } from "react";
import {
  applyUpdateXeroBoardAction,
  getLastXeroSyncSummaryAction,
  previewUpdateXeroBoardAction,
  restoreCorruptedXeroContactsAction,
  undoLastXeroSyncAction,
  type XeroUpdatePreview,
} from "@/app/admin/operations/project-actions";
import type { FieldChange } from "@/lib/operations/xero-contact-backfill";
import { AdminButton } from "@/components/admin/ui";

const FIELD_LABEL: Record<FieldChange["field"], string> = {
  contact_person: "Client",
  contact_email: "Email",
  contact_phone: "Phone",
  customer_name: "Company",
  xero_contact_id: "Xero contact",
  site_province: "Province",
  site_town: "Town",
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function UpdateXeroControls() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<XeroUpdatePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<{ at: string; changeCount: number; undone: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void getLastXeroSyncSummaryAction().then(setLastRun);
    // Repair K&S49 overwrite as soon as the board loads for someone who can sync.
    void restoreCorruptedXeroContactsAction().then((r) => {
      if (r.restored > 0) {
        setMessage(`Restored client details on ${r.restored} project${r.restored === 1 ? "" : "s"}.`);
      }
    });
  }, []);

  const openPreview = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await previewUpdateXeroBoardAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreview(result);
      setLastRun(result.lastRun);
      setOpen(true);
    });
  };

  const confirmApply = () => {
    if (!preview) return;
    startTransition(async () => {
      const result = await applyUpdateXeroBoardAction({ changes: preview.changes });
      if (result?.ok) {
        setMessage(result.message);
        setOpen(false);
        setPreview(null);
        const next = await getLastXeroSyncSummaryAction();
        setLastRun(next);
      } else {
        setError(result?.message ?? "Update failed.");
      }
    });
  };

  const undo = () => {
    startTransition(async () => {
      const result = await undoLastXeroSyncAction();
      if (result?.ok) {
        setMessage(result.message);
        const next = await getLastXeroSyncSummaryAction();
        setLastRun(next);
      } else {
        setError(result?.message ?? "Undo failed.");
      }
    });
  };

  return (
    <div className="ops-xero-update">
      <div className="ops-xero-update__row">
        <AdminButton type="button" variant="secondary" disabled={pending} onClick={openPreview}>
          {pending && !open ? "Checking…" : "Update Xero"}
        </AdminButton>
        {lastRun && !lastRun.undone ? (
          <>
            <span className="ops-xero-update__meta">
              Last updated {formatTime(lastRun.at)}, {lastRun.changeCount} change
              {lastRun.changeCount === 1 ? "" : "s"}
            </span>
            <AdminButton type="button" variant="ghost" disabled={pending} onClick={undo}>
              Undo last sync
            </AdminButton>
          </>
        ) : lastRun?.undone ? (
          <span className="ops-xero-update__meta">Last sync undone</span>
        ) : null}
      </div>
      {message ? (
        <p className="admin-action-message admin-action-message--success" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="admin-action-message admin-action-message--error" role="alert">
          {error}
        </p>
      ) : null}

      {open && preview ? (
        <div className="ops-xero-update__dialog" role="dialog" aria-modal="true" aria-labelledby="ops-xero-update-title">
          <div className="ops-xero-update__panel">
            <h2 id="ops-xero-update-title">
              Update {preview.projectCount} projects from Xero? Only empty fields will be filled.
            </h2>
            {preview.changes.length === 0 ? (
              <p className="ops-table__meta">No empty contact fields to fill. Payment statuses will still refresh.</p>
            ) : (
              <div className="ops-xero-update__preview">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Project</th>
                      <th scope="col">Field</th>
                      <th scope="col">New value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.changes.slice(0, 80).map((c, i) => (
                      <tr key={`${c.projectId}-${c.field}-${i}`}>
                        <td>{c.projectTitle}</td>
                        <td>{FIELD_LABEL[c.field]}</td>
                        <td>{c.to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.changes.length > 80 ? (
                  <p className="ops-table__meta">…and {preview.changes.length - 80} more</p>
                ) : null}
              </div>
            )}
            {preview.dualContactFlags.length ? (
              <p className="ops-table__meta" role="status">
                Two Xero contacts (quote vs invoice): {preview.dualContactFlags.join(", ")}
              </p>
            ) : null}
            <div className="ops-xero-update__actions">
              <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => setOpen(false)}>
                Cancel
              </AdminButton>
              <AdminButton type="button" disabled={pending} onClick={confirmApply}>
                {pending ? "Updating…" : `Confirm (${preview.changes.length} field changes)`}
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
