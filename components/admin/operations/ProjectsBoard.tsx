"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  AdminActionForm,
  AdminButton,
  AdminSelect,
  AdminSubmitButton,
} from "@/components/admin/ui";
import {
  bulkArchiveProjectsAction,
  bulkMoveProjectsAction,
  createProjectQuickAction,
  deleteProjectsAction,
  duplicateProjectsAction,
} from "@/app/admin/operations/project-actions";
import { loadBoardXeroQuotesAction } from "@/app/admin/operations/board-xero-actions";
import type { XeroStartItem } from "@/lib/operations/xero-start";
import {
  GROUP_LABELS,
  PROJECT_GROUPS,
  PAYMENT_LABEL_TEXT,
  boardGroups,
  isLinkedToXero,
  type ProjectGroup,
} from "@/lib/operations/board";
import { formatLocationCell } from "@/lib/operations/distance";
import type { BoardProject } from "@/lib/operations/queries";
import { AddFromXeroDialog } from "./AddFromXeroDialog";
import { PaymentPictureBadge } from "./PaymentPictureBadge";
import { PhoneCell } from "./PhoneCell";
import { formatOpsMoney } from "./ops-format";

const COLLAPSE_KEY = "ops-board-collapsed-groups";
const COLLAPSE_EVENT = "ops-board-collapsed";

/** Store the raw string so getSnapshot stays referentially stable between reads. */
function subscribeCollapsed(onStoreChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getCollapsedRaw(): string {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) ?? "";
  } catch {
    return "";
  }
}

function parseCollapsed(raw: string): ProjectGroup[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((g): g is ProjectGroup => PROJECT_GROUPS.includes(g as ProjectGroup)) : [];
  } catch {
    return [];
  }
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function downloadCsv(projects: BoardProject[]) {
  const header = ["Project", "Lead", "Payment", "Client", "Phone", "Xero", "Value", "Location"];
  const lines = [
    header.join(","),
    ...projects.map((p) =>
      [
        p.title,
        p.leadName ?? "",
        p.payment.label ? PAYMENT_LABEL_TEXT[p.payment.label] : "",
        p.contact_person ?? "",
        p.contact_phone ?? "",
        [...p.xero_quote_numbers, ...p.xero_invoice_numbers].join(" "),
        p.quoted_total_incl_vat == null ? "" : String(p.quoted_total_incl_vat),
        formatLocationCell(p) ?? "",
      ]
        .map((v) => csvCell(v))
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "damtech-projects.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ProjectsBoard({
  projects,
  canEdit,
}: {
  projects: BoardProject[];
  canEdit: boolean;
}) {
  const groups = useMemo(() => boardGroups(projects), [projects]);
  const collapsedRaw = useSyncExternalStore(subscribeCollapsed, getCollapsedRaw, () => "");
  const collapsed = useMemo(() => parseCollapsed(collapsedRaw), [collapsedRaw]);
  const [frozen, setFrozen] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [xeroGroup, setXeroGroup] = useState<ProjectGroup | null>(null);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [xeroQuotes, setXeroQuotes] = useState<XeroStartItem[]>([]);
  const [xeroError, setXeroError] = useState<string | null>(null);
  const [xeroLoading, setXeroLoading] = useState(false);

  const openXeroPicker = async (next: { group?: ProjectGroup | null; linkId?: string | null }) => {
    setXeroGroup(next.group ?? null);
    setLinkId(next.linkId ?? null);
    setXeroLoading(true);
    setXeroError(null);
    try {
      const result = await loadBoardXeroQuotesAction();
      setXeroQuotes(result.items);
      setXeroError(result.error);
    } catch {
      setXeroQuotes([]);
      setXeroError("Xero quotes could not be loaded.");
    } finally {
      setXeroLoading(false);
    }
  };

  const toggleGroup = (group: ProjectGroup) => {
    const next = collapsed.includes(group) ? collapsed.filter((g) => g !== group) : [...collapsed, group];
    try {
      window.localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
    } catch {
      // Private mode: collapse still works until reload.
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  };

  const visibleIds = projects.map((p) => p.id);
  const selectedProjects = projects.filter((p) => selected.has(p.id));
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const idsValue = selectedProjects.map((p) => p.id).join(",");
  const singleUnlinked = selectedProjects.length === 1 && !isLinkedToXero(selectedProjects[0]) ? selectedProjects[0] : null;

  const toggleOne = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allVisibleSelected ? new Set() : new Set(visibleIds));
  };

  return (
    <div className={`ops-sheet${frozen ? " ops-sheet--frozen" : ""}`}>
      <div className="ops-sheet__toolbar">
        <AdminButton type="button" variant="ghost" size="sm" onClick={() => setFrozen((v) => !v)}>
          {frozen ? "Unfreeze columns" : "Freeze columns"}
        </AdminButton>
      </div>
      <div className="ops-sheet__scroll">
        <table className="admin-table ops-table ops-board-table ops-sheet__table">
          <thead>
            <tr>
              <th className="ops-sheet__c-check ops-sheet__sticky" scope="col">
                <span className="sr-only">Select</span>
                {canEdit ? (
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all projects" />
                ) : null}
              </th>
              <th className="ops-sheet__c-project ops-sheet__sticky" scope="col">
                Project
              </th>
              <th className="ops-sheet__c-lead ops-sheet__sticky" scope="col">
                Project lead
              </th>
              <th className="ops-sheet__c-pay ops-sheet__sticky" scope="col">
                Payment
              </th>
              <th scope="col">Client</th>
              <th scope="col">Xero</th>
              <th scope="col">Value</th>
              <th scope="col">Location</th>
            </tr>
          </thead>
          {groups.map(({ group, projects: rows }) => {
            const open = !collapsed.includes(group);
            return (
              <tbody key={group} className={`ops-sheet__group ops-sheet__group--${group}${open ? "" : " is-collapsed"}`}>
                <tr className="ops-sheet__group-row">
                  <th colSpan={8} scope="colgroup">
                    <button
                      type="button"
                      className={`ops-sheet__group-btn ops-sheet__group-btn--${group}`}
                      aria-expanded={open}
                      onClick={() => toggleGroup(group)}
                    >
                      <span className="ops-sheet__chevron" aria-hidden="true">
                        {open ? "▾" : "▸"}
                      </span>
                      {GROUP_LABELS[group]}
                      <span className="ops-group__count">{rows.length}</span>
                    </button>
                  </th>
                </tr>
                {open
                  ? rows.map((p) => (
                      <tr key={p.id} className={selected.has(p.id) ? "is-selected" : undefined}>
                        <td className="ops-sheet__c-check ops-sheet__sticky" data-label="Select">
                          {canEdit ? (
                            <input
                              type="checkbox"
                              checked={selected.has(p.id)}
                              onChange={() => toggleOne(p.id)}
                              aria-label={`Select ${p.title}`}
                            />
                          ) : null}
                        </td>
                        <td className="ops-sheet__c-project ops-sheet__sticky" data-label="Project">
                          <Link href={`/admin/operations/projects/${p.id}/`} className="ops-table__title">
                            {p.title}
                          </Link>
                          {p.needs_review ? <span className="ops-table__meta">Check details</span> : null}
                        </td>
                        <td className="ops-sheet__c-lead ops-sheet__sticky" data-label="Project lead">
                          {p.leadName || <span className="ops-table__meta">—</span>}
                        </td>
                        <td className="ops-sheet__c-pay ops-sheet__sticky" data-label="Payment">
                          <PaymentPictureBadge payment={p.payment} />
                        </td>
                        <td data-label="Client">
                          <PhoneCell name={p.contact_person} phone={p.contact_phone} />
                        </td>
                        <td data-label="Xero">
                          {[...(Array.isArray(p.xero_quote_numbers) ? p.xero_quote_numbers : []), ...(Array.isArray(p.xero_invoice_numbers) ? p.xero_invoice_numbers : [])].join(" · ") || (
                            <span className="ops-table__meta">—</span>
                          )}
                        </td>
                        <td data-label="Value">{formatOpsMoney(p.quoted_total_incl_vat)}</td>
                        <td data-label="Location">
                          {formatLocationCell(p) || <span className="ops-table__meta">—</span>}
                        </td>
                      </tr>
                    ))
                  : null}
                {open && canEdit && group !== "completed" ? (
                  <tr className="ops-sheet__add-row">
                    <td className="ops-sheet__c-check ops-sheet__sticky" />
                    <td colSpan={7} className="ops-sheet__add">
                      <AdminActionForm action={createProjectQuickAction} className="ops-sheet__add-form" resetOnSuccess>
                        <input type="hidden" name="group" value={group} />
                        <input
                          className="admin-input ops-sheet__add-input"
                          name="title"
                          maxLength={200}
                          placeholder="+ Add Project"
                          aria-label={`Add project to ${GROUP_LABELS[group]}`}
                        />
                        <AdminSubmitButton variant="outline" pendingLabel="Adding…">
                          Add
                        </AdminSubmitButton>
                      </AdminActionForm>
                      <AdminButton type="button" variant="ghost" size="sm" onClick={() => void openXeroPicker({ group })}>
                        + Add from Xero
                      </AdminButton>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            );
          })}
        </table>
      </div>

      {selectedProjects.length > 0 && canEdit ? (
        <div className="ops-selection-bar" role="toolbar" aria-label="Selected projects">
          <strong className="ops-selection-bar__count">
            {selectedProjects.length} {selectedProjects.length === 1 ? "Item selected" : "Items selected"}
          </strong>
          <AdminActionForm action={duplicateProjectsAction} className="ops-selection-bar__action">
            <input type="hidden" name="ids" value={idsValue} />
            <AdminSubmitButton variant="outline" pendingLabel="Copying…">
              Copy
            </AdminSubmitButton>
          </AdminActionForm>
          <AdminButton type="button" variant="ghost" onClick={() => downloadCsv(selectedProjects)}>
            Export
          </AdminButton>
          <AdminActionForm
            action={bulkArchiveProjectsAction}
            className="ops-selection-bar__action"
            confirmMessage="Archive the selected projects? They leave the active board."
          >
            <input type="hidden" name="ids" value={idsValue} />
            <AdminSubmitButton variant="outline" pendingLabel="Archiving…">
              Archive
            </AdminSubmitButton>
          </AdminActionForm>
          <AdminActionForm
            action={deleteProjectsAction}
            className="ops-selection-bar__action"
            confirmMessage="Delete the selected projects? This cannot be undone."
          >
            <input type="hidden" name="ids" value={idsValue} />
            <AdminSubmitButton variant="danger" pendingLabel="Deleting…">
              Delete
            </AdminSubmitButton>
          </AdminActionForm>
          <AdminActionForm action={bulkMoveProjectsAction} className="ops-selection-bar__move">
            <input type="hidden" name="ids" value={idsValue} />
            <AdminSelect name="group" aria-label="Move to stage" defaultValue="">
              <option value="" disabled>
                Move to
              </option>
              {PROJECT_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {GROUP_LABELS[g]}
                </option>
              ))}
            </AdminSelect>
            <AdminSubmitButton variant="outline" pendingLabel="Moving…">
              Move
            </AdminSubmitButton>
          </AdminActionForm>
          {singleUnlinked ? (
            <AdminButton type="button" variant="secondary" onClick={() => void openXeroPicker({ linkId: singleUnlinked.id })}>
              Link to Xero
            </AdminButton>
          ) : null}
          <AdminButton type="button" variant="ghost" aria-label="Clear selection" onClick={() => setSelected(new Set())}>
            ×
          </AdminButton>
        </div>
      ) : null}

      <AddFromXeroDialog
        open={xeroGroup !== null || linkId !== null}
        onClose={() => {
          setXeroGroup(null);
          setLinkId(null);
        }}
        items={xeroQuotes}
        error={xeroError}
        loading={xeroLoading}
        group={xeroGroup}
        linkProjectId={linkId}
      />
    </div>
  );
}
