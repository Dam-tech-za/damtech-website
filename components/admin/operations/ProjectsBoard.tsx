"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
import { ProjectPeekDrawer } from "./ProjectPeekDrawer";
import { formatOpsMoney } from "./ops-format";

const COLLAPSE_KEY = "ops-board-collapsed-groups";
const COLLAPSE_EVENT = "ops-board-collapsed";
const FREEZE_KEY = "ops-board-freeze-columns";

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

function subscribeFreeze(onStoreChange: () => void) {
  window.addEventListener("ops-board-freeze", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("ops-board-freeze", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getFreezeRaw(): string {
  try {
    return window.localStorage.getItem(FREEZE_KEY) ?? "1";
  } catch {
    return "1";
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
        [...(p.xero_quote_numbers ?? []), ...(p.xero_invoice_numbers ?? [])].join(" "),
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

function XeroCell({ quotes, invoices }: { quotes: string[]; invoices: string[] }) {
  const numbers = [...quotes, ...invoices].filter(Boolean);
  if (!numbers.length) return <span className="ops-table__meta">—</span>;
  if (numbers.length === 1) return <span className="ops-xero-cell">{numbers[0]}</span>;
  return (
    <span className="ops-xero-cell" title={numbers.join(" · ")}>
      {numbers[0]} <span className="ops-xero-cell__more">+{numbers.length - 1}</span>
    </span>
  );
}

function AddProjectRow({
  group,
  canEdit,
  autoFocus,
  onAddFromXero,
}: {
  group: ProjectGroup;
  canEdit: boolean;
  autoFocus?: boolean;
  onAddFromXero: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);
  if (!canEdit || group === "completed") return null;
  return (
    <tr className="ops-sheet__add-row">
      <td className="ops-sheet__c-check ops-sheet__sticky" />
      <td colSpan={7} className="ops-sheet__add">
        <AdminActionForm action={createProjectQuickAction} className="ops-sheet__add-form" resetOnSuccess>
          <input type="hidden" name="group" value={group} />
          <input
            ref={inputRef}
            className="admin-input ops-sheet__add-input"
            name="title"
            maxLength={200}
            placeholder="+ Add Project"
            aria-label={`Add project to ${GROUP_LABELS[group]}`}
            autoComplete="off"
          />
          <button type="submit" className="sr-only">
            Add
          </button>
        </AdminActionForm>
        <button type="button" className="ops-sheet__xero-link" onClick={onAddFromXero}>
          + Add from Xero
        </button>
      </td>
    </tr>
  );
}

export function ProjectsBoard({
  projects,
  canEdit,
  focusAdd = false,
}: {
  projects: BoardProject[];
  canEdit: boolean;
  /** When true (from ?add=1), focus the first stage add input. */
  focusAdd?: boolean;
}) {
  const groups = useMemo(() => boardGroups(projects), [projects]);
  const collapsedRaw = useSyncExternalStore(subscribeCollapsed, getCollapsedRaw, () => "");
  const collapsed = useMemo(() => parseCollapsed(collapsedRaw), [collapsedRaw]);
  const freezeRaw = useSyncExternalStore(subscribeFreeze, getFreezeRaw, () => "1");
  const frozen = freezeRaw !== "0";
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [peekId, setPeekId] = useState<string | null>(null);
  const [xeroGroup, setXeroGroup] = useState<ProjectGroup | null>(null);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [xeroQuotes, setXeroQuotes] = useState<XeroStartItem[]>([]);
  const [xeroError, setXeroError] = useState<string | null>(null);
  const [xeroLoading, setXeroLoading] = useState(false);

  const peek = peekId ? projects.find((p) => p.id === peekId) ?? null : null;

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

  const writeCollapsed = (next: ProjectGroup[]) => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
    } catch {
      // Private mode.
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  };

  const toggleGroup = (group: ProjectGroup) => {
    writeCollapsed(collapsed.includes(group) ? collapsed.filter((g) => g !== group) : [...collapsed, group]);
  };

  // Warm the 30-day Xero quote cache so Add from Xero opens quickly.
  useEffect(() => {
    if (!canEdit) return;
    void loadBoardXeroQuotesAction()
      .then((result) => {
        setXeroQuotes(result.items);
        setXeroError(result.error);
      })
      .catch(() => {
        // Leave picker to load on demand if prefetch fails.
      });
  }, [canEdit]);

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

  const firstEditableGroup = PROJECT_GROUPS.find((g) => g !== "completed") ?? "awaiting";

  return (
    <div className={`ops-sheet${frozen ? " ops-sheet--frozen" : ""}`}>
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
              <th className="ops-sheet__c-lead" scope="col">
                Lead
              </th>
              <th className="ops-sheet__c-pay ops-sheet__sticky" scope="col">
                Payment
              </th>
              <th className="ops-sheet__c-client" scope="col">
                Client
              </th>
              <th className="ops-sheet__c-xero" scope="col">
                Xero
              </th>
              <th className="ops-sheet__c-value" scope="col">
                Value
              </th>
              <th className="ops-sheet__c-location" scope="col">
                Location
              </th>
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
                          <button
                            type="button"
                            className="ops-table__title ops-table__title-btn"
                            title={p.title}
                            onClick={() => setPeekId(p.id)}
                          >
                            {p.title}
                          </button>
                          {p.needs_review ? <span className="ops-table__meta">Check details</span> : null}
                        </td>
                        <td className="ops-sheet__c-lead" data-label="Lead">
                          {p.leadName || <span className="ops-table__meta">—</span>}
                        </td>
                        <td className="ops-sheet__c-pay ops-sheet__sticky" data-label="Payment">
                          <PaymentPictureBadge payment={p.payment} />
                        </td>
                        <td className="ops-sheet__c-client" data-label="Client">
                          <PhoneCell name={p.contact_person || p.customer_name} phone={p.contact_phone} />
                        </td>
                        <td className="ops-sheet__c-xero" data-label="Xero">
                          <XeroCell quotes={p.xero_quote_numbers ?? []} invoices={p.xero_invoice_numbers ?? []} />
                        </td>
                        <td className="ops-sheet__c-value" data-label="Value">
                          {formatOpsMoney(p.quoted_total_incl_vat)}
                        </td>
                        <td className="ops-sheet__c-location" data-label="Location">
                          {formatLocationCell(p) || <span className="ops-table__meta">—</span>}
                        </td>
                      </tr>
                    ))
                  : null}
                {open ? (
                  <AddProjectRow
                    group={group}
                    canEdit={canEdit}
                    autoFocus={focusAdd && group === firstEditableGroup}
                    onAddFromXero={() => void openXeroPicker({ group })}
                  />
                ) : null}
              </tbody>
            );
          })}
        </table>
      </div>

      {selectedProjects.length > 0 && canEdit ? (
        <div className="ops-selection-bar" role="toolbar" aria-label="Selected projects">
          <strong className="ops-selection-bar__count">
            {selectedProjects.length} selected
          </strong>
          <AdminActionForm action={duplicateProjectsAction} className="ops-selection-bar__action">
            <input type="hidden" name="ids" value={idsValue} />
            <AdminSubmitButton variant="outline" pendingLabel="Copying…">
              Copy
            </AdminSubmitButton>
          </AdminActionForm>
          <AdminButton type="button" variant="ghost" onClick={() => downloadCsv(selectedProjects)}>
            Export CSV
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
            <AdminSelect
              name="group"
              aria-label="Move to stage"
              defaultValue=""
              onChange={(event) => {
                const form = event.currentTarget.form;
                if (!event.currentTarget.value || !form) return;
                form.requestSubmit();
              }}
            >
              <option value="" disabled>
                Move to
              </option>
              {PROJECT_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {GROUP_LABELS[g]}
                </option>
              ))}
            </AdminSelect>
          </AdminActionForm>
          {singleUnlinked ? (
            <AdminButton type="button" variant="ghost" onClick={() => void openXeroPicker({ linkId: singleUnlinked.id })}>
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

      <ProjectPeekDrawer project={peek} onClose={() => setPeekId(null)} />
    </div>
  );
}
