"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { AdminButton } from "@/components/admin/ui";
import {
  refreshProjectFromXeroAction,
  updateBoardFieldAction,
  useXeroTotalAction,
} from "@/app/admin/operations/board-field-actions";
import { STAGE_LABELS } from "@/lib/operations/lifecycle";
import { PROJECT_STAGES } from "@/lib/operations/types";
import { stripBoardMetaFromScope } from "@/lib/operations/board-meta";
import { formatLocationCell } from "@/lib/operations/distance";
import type { BoardProject } from "@/lib/operations/queries";
import {
  ClientEditCell,
  LeadCell,
  LocationEditCell,
  PaymentEditCell,
  ValueEditCell,
  XeroEditCell,
} from "./BoardEditableCells";
import { formatOpsMoney } from "./ops-format";

export function ProjectPeekDrawer({
  project,
  onClose,
  onPatched,
  leadSuggestions,
  onLinkXero,
}: {
  project: BoardProject | null;
  onClose: () => void;
  onPatched?: (p: BoardProject) => void;
  leadSuggestions: string[];
  onLinkXero?: () => void;
}) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [company, setCompany] = useState(project?.customer_name ?? "");
  const [email, setEmail] = useState(project?.contact_email ?? "");
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState(project?.next_action ?? "");
  const [nextDue, setNextDue] = useState(project?.next_action_due ?? "");
  const [stage, setStage] = useState(project?.stage ?? "awaiting_deposit");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!project) return;
    setTitle(project.title);
    setCompany(project.customer_name ?? "");
    setEmail(project.contact_email ?? "");
    setNotes(stripBoardMetaFromScope(project.scope));
    setNextAction(project.next_action ?? "");
    setNextDue(project.next_action_due ?? "");
    setStage(project.stage);
  }, [project]);

  const save = async (field: string, value: string) => {
    if (!project) return;
    setBusy(field);
    const result = await updateBoardFieldAction({ id: project.id, field, value });
    setBusy(null);
    if (!result?.ok) {
      window.alert(result?.message || "Could not save.");
      return;
    }
    onPatched?.({ ...project });
  };

  return (
    <AdminDrawer open={Boolean(project)} title={project?.title || "Project"} onClose={onClose}>
      {project ? (
        <div className="ops-peek-form">
          <label className="ops-peek-form__field">
            <span>Project name</span>
            <input
              className="admin-input"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => void save("title", title)}
            />
          </label>
          <label className="ops-peek-form__field">
            <span>Lead</span>
            <LeadCell project={project} canEdit suggestions={leadSuggestions} onPatched={onPatched} />
          </label>
          <label className="ops-peek-form__field">
            <span>Payment</span>
            <PaymentEditCell project={project} canEdit onPatched={onPatched} />
          </label>
          <label className="ops-peek-form__field">
            <span>Company</span>
            <input
              className="admin-input"
              value={company}
              maxLength={200}
              onChange={(e) => setCompany(e.target.value)}
              onBlur={() => void save("company", company)}
            />
          </label>
          <div className="ops-peek-form__field">
            <span>Client</span>
            <ClientEditCell project={project} canEdit onPatched={onPatched} />
          </div>
          <label className="ops-peek-form__field">
            <span>Client email</span>
            <input
              className="admin-input"
              type="email"
              value={email}
              maxLength={200}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => void save("email", email)}
            />
          </label>
          <div className="ops-peek-form__field">
            <span>Xero</span>
            <XeroEditCell project={project} canEdit onPatched={onPatched} />
            {onLinkXero ? (
              <button type="button" className="ops-sheet__text-btn" onClick={onLinkXero}>
                Link to Xero
              </button>
            ) : null}
          </div>
          <div className="ops-peek-form__field">
            <span>Value {formatOpsMoney(project.quoted_total_incl_vat)}</span>
            <ValueEditCell project={project} canEdit onPatched={onPatched} />
            <button
              type="button"
              className="ops-sheet__text-btn"
              disabled={busy === "xero-total"}
              onClick={() => {
                void (async () => {
                  setBusy("xero-total");
                  const result = await useXeroTotalAction({ id: project.id });
                  setBusy(null);
                  if (!result?.ok) window.alert(result?.message || "Could not use Xero total.");
                  else onPatched?.({ ...project });
                })();
              }}
            >
              Use Xero total
            </button>
          </div>
          <div className="ops-peek-form__field">
            <span>Location</span>
            <LocationEditCell
              project={project}
              canEdit
              display={formatLocationCell(project)}
              onPatched={onPatched}
            />
          </div>
          <label className="ops-peek-form__field">
            <span>Site address / notes</span>
            <textarea
              className="admin-input"
              rows={3}
              value={notes}
              maxLength={8000}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => void save("notes", notes)}
            />
          </label>
          <label className="ops-peek-form__field">
            <span>Next step</span>
            <input
              className="admin-input"
              value={nextAction}
              maxLength={500}
              onChange={(e) => setNextAction(e.target.value)}
              onBlur={() => void save("next_action", nextAction)}
            />
          </label>
          <label className="ops-peek-form__field">
            <span>Next step by</span>
            <input
              className="admin-input"
              type="date"
              value={nextDue}
              onChange={(e) => setNextDue(e.target.value)}
              onBlur={() => void save("next_action_due", nextDue)}
            />
          </label>
          <label className="ops-peek-form__field">
            <span>Stage</span>
            <select
              className="admin-select"
              value={stage}
              onChange={(e) => {
                const next = e.target.value;
                setStage(next as BoardProject["stage"]);
                void save("stage", next);
              }}
            >
              {PROJECT_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <div className="ops-peek-form__actions">
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy === "refresh"}
              onClick={() => {
                void (async () => {
                  setBusy("refresh");
                  const result = await refreshProjectFromXeroAction({ id: project.id });
                  setBusy(null);
                  window.alert(result?.message || (result?.ok ? "Updated." : "Failed."));
                  if (result?.ok) onPatched?.({ ...project });
                })();
              }}
            >
              Refresh from Xero
            </AdminButton>
            <Link href={`/admin/operations/projects/${project.id}/`} className="admin-btn admin-btn--secondary admin-btn--sm">
              Open full details
            </Link>
          </div>
        </div>
      ) : null}
    </AdminDrawer>
  );
}
