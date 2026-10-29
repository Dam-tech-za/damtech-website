"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  applyBulkFromXeroAction,
  previewBulkFromXeroAction,
  undoBulkFromXeroAction,
  type BulkPreviewResult,
} from "@/app/admin/operations/xero-bulk-actions";
import { displayPhone } from "@/lib/operations/phone-display";
import type { ReviewRow } from "@/lib/operations/xero-review";

type Line = { row: ReviewRow; value: string; accept: boolean };
type ProjectLines = { projectId: string; title: string; documentNumber: string; contactId: string; lines: Line[] };

function shown(field: string, value: string): string {
  if (field === "contact_phone" && value) {
    const p = displayPhone(value);
    return p ? p.text : value;
  }
  return value || "—";
}

/**
 * "Sync from Xero…": one review table for every project with a Xero number.
 * Nothing is written until you press Apply, and then only ticked lines.
 */
export function SyncFromXeroDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<BulkPreviewResult | null>(null);
  const [projects, setProjects] = useState<ProjectLines[]>([]);
  const [done, setDone] = useState<{ message: string; logIds: string[]; failed: { projectId: string; error: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending]);

  const start = () => {
    setOpen(true);
    setResult(null);
    setProjects([]);
    setDone(null);
    setError(null);
    startTransition(async () => {
      const r = await previewBulkFromXeroAction();
      setResult(r);
      if (r.ok) {
        setProjects(
          r.items.flatMap((it) =>
            it.ok
              ? [
                  {
                    projectId: it.projectId,
                    title: it.title,
                    documentNumber: it.preview.documentNumber,
                    contactId: it.preview.contactId,
                    lines: it.preview.rows.map((row) => ({ row, value: row.proposed, accept: row.defaultAccept })),
                  },
                ]
              : [],
          ),
        );
      }
    });
  };

  const setLine = (pi: number, li: number, patch: Partial<Line>) =>
    setProjects((cur) => cur.map((p, i) => (i === pi ? { ...p, lines: p.lines.map((l, j) => (j === li ? { ...l, ...patch } : l)) } : p)));

  const accepted = projects.reduce((n, p) => n + p.lines.filter((l) => l.accept && l.value.trim()).length, 0);

  const apply = () => {
    setError(null);
    startTransition(async () => {
      const r = await applyBulkFromXeroAction({
        items: projects.map((p) => ({
          projectId: p.projectId,
          documentNumber: p.documentNumber,
          contactId: p.contactId,
          accepted: p.lines.filter((l) => l.accept && l.value.trim()).map((l) => ({ field: l.row.field, value: l.value })),
        })),
      });
      if (r && "logIds" in r) {
        setDone({ message: r.message, logIds: r.logIds, failed: r.failed });
        router.refresh();
      } else setError(r?.message ?? "Nothing was changed.");
    });
  };

  const undo = () => {
    if (!done?.logIds.length) return;
    startTransition(async () => {
      const r = await undoBulkFromXeroAction(done.logIds);
      setDone({ message: r?.message ?? "Undone.", logIds: [], failed: [] });
      router.refresh();
    });
  };

  const failures = result?.ok ? result.items.filter((it) => !it.ok) : [];

  return (
    <>
      <button type="button" className="admin-btn admin-btn--secondary" onClick={start}>
        Sync from Xero…
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="ops-xero-review" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !pending && setOpen(false)}>
              <div className="ops-xero-review__card ops-xero-sync" role="dialog" aria-modal="true" aria-labelledby="ops-xero-sync-title">
                <header className="ops-xero-review__head">
                  <h2 id="ops-xero-sync-title">Sync from Xero</h2>
                  <p className="ops-xero-review__sub">
                    Each project is read from its own Xero quote or invoice. Tick what to take over; nothing changes until you apply.
                  </p>
                </header>

                {pending && !result ? <p className="ops-xero-review__status">Reading Xero… this can take a little while.</p> : null}
                {result && !result.ok ? <p className="ops-xero-review__error">{result.error}</p> : null}
                {error ? <p className="ops-xero-review__error">{error}</p> : null}

                {done ? (
                  <div className="ops-xero-sync__done">
                    <p>
                      <strong>{done.message}</strong>
                    </p>
                    {done.failed.length ? (
                      <ul className="ops-xero-sync__list">
                        {done.failed.map((f) => (
                          <li key={f.projectId}>{projects.find((p) => p.projectId === f.projectId)?.title ?? "A project"}: {f.error}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : result?.ok ? (
                  <div className="ops-xero-sync__body">
                    <p className="ops-xero-review__doc">
                      {projects.length ? `${projects.length} project${projects.length === 1 ? "" : "s"} with differences` : "No differences found"}
                      {result.alreadyMatch ? ` · ${result.alreadyMatch} already match Xero` : ""}
                      {result.stoppedEarly ? " · stopped early to stay within Xero's limits; run it again for the rest" : ""}
                    </p>

                    {projects.map((p, pi) => (
                      <section key={p.projectId} className="ops-xero-sync__project">
                        <h3>
                          {p.title} <span className="ops-table__meta">from {p.documentNumber}</span>
                        </h3>
                        <div className="ops-xero-review__table" role="table">
                          {p.lines.map((l, li) => (
                            <div key={l.row.field} className="ops-xero-review__tr" role="row">
                              <span role="cell" className="ops-xero-review__label">
                                {l.row.label}
                              </span>
                              <span role="cell" className="ops-xero-review__current">
                                {shown(l.row.field, l.row.current)}
                              </span>
                              <span role="cell">
                                <input
                                  className="admin-input ops-xero-review__input"
                                  value={l.value}
                                  onChange={(e) => setLine(pi, li, { value: e.target.value })}
                                  aria-label={`${l.row.label} for ${p.title} from Xero`}
                                />
                              </span>
                              <span role="cell" className="ops-xero-review__toggles">
                                <label className="ops-xero-sync__accept">
                                  <input type="checkbox" checked={l.accept} onChange={(e) => setLine(pi, li, { accept: e.target.checked })} /> Accept
                                </label>
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}

                    {failures.length ? (
                      <section className="ops-xero-sync__project">
                        <h3>Couldn&apos;t read from Xero</h3>
                        <ul className="ops-xero-sync__list">
                          {failures.map((f) => (
                            <li key={f.projectId}>
                              {f.title}: {!f.ok ? f.error : ""}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}

                    {result.withoutNumber.length ? (
                      <section className="ops-xero-sync__project">
                        <h3>No Xero number yet ({result.withoutNumber.length})</h3>
                        <p className="ops-table__meta">{result.withoutNumber.map((p) => p.title).join(" · ")}</p>
                      </section>
                    ) : null}
                  </div>
                ) : null}

                <footer className="ops-xero-review__foot">
                  {done ? (
                    <>
                      {done.logIds.length ? (
                        <button type="button" className="admin-btn" onClick={undo} disabled={pending}>
                          Undo
                        </button>
                      ) : null}
                      <button type="button" className="admin-btn admin-btn--primary" onClick={() => setOpen(false)}>
                        Close
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="admin-btn" onClick={() => setOpen(false)} disabled={pending}>
                        Cancel
                      </button>
                      <button type="button" className="admin-btn admin-btn--primary" onClick={apply} disabled={pending || !accepted}>
                        {pending && result ? "Applying…" : `Apply ${accepted} change${accepted === 1 ? "" : "s"}`}
                      </button>
                    </>
                  )}
                </footer>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
