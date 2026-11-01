"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AdminActionForm } from "@/components/admin/ui";
import { createProjectQuickAction } from "@/app/admin/operations/project-actions";
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
import { SERVICE_LABELS } from "@/lib/operations/lifecycle";
import type { BoardProject } from "@/lib/operations/queries";
import { mergeLeadSuggestions } from "@/lib/operations/board-meta";
import { AddFromXeroDialog } from "./AddFromXeroDialog";
import {
  ClientEditCell,
  EmailEditCell,
  LeadCell,
  LocationEditCell,
  PaymentEditCell,
  TitleCell,
  ValueEditCell,
  XeroEditCell,
} from "./BoardEditableCells";
import { FromXeroReviewCard } from "./FromXeroReviewCard";
import { ProjectPeekDrawer } from "./ProjectPeekDrawer";
import { SelectionBar } from "./SelectionBar";
import { ServiceEditCell } from "./ServiceEditCell";

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
  const header = ["Project", "Type", "Lead", "Payment", "Client", "Email", "Xero", "Value", "Location"];
  const lines = [
    header.join(","),
    ...projects.map((p) =>
      [
        p.title,
        SERVICE_LABELS[p.service],
        p.leadName ?? "",
        p.payment.label ? PAYMENT_LABEL_TEXT[p.payment.label] : "",
        p.contact_person ?? "",
        p.contact_email ?? "",
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

function AddProjectRow({
  group,
  canEdit,
  autoFocus,
  onAddFromXero,
  colSpan,
}: {
  group: ProjectGroup;
  canEdit: boolean;
  autoFocus?: boolean;
  onAddFromXero: () => void;
  colSpan: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);
  if (!canEdit) return null;
  return (
    <tr className="ops-sheet__add-row">
      <td colSpan={colSpan} className="ops-sheet__add">
        <div className="ops-sheet__sticky-row">
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
          {group !== "completed" ? (
            <button type="button" className="ops-sheet__xero-link" onClick={onAddFromXero}>
              + Add from Xero
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export function ProjectsBoard({
  projects: projectsProp,
  canEdit,
  focusAdd = false,
  hideEmptyGroups = false,
  leadSuggestions = [],
  hiddenColumns = [],
}: {
  projects: BoardProject[];
  canEdit: boolean;
  /** When true (from ?add=1), focus the first stage add input. */
  focusAdd?: boolean;
  /** When a stage/payment filter is active, hide empty stage headers. */
  hideEmptyGroups?: boolean;
  leadSuggestions?: string[];
  hiddenColumns?: Array<"type" | "lead" | "client" | "email" | "xero" | "value" | "location">;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const projectThRef = useRef<HTMLTableCellElement>(null);
  const [rows, setRows] = useState(projectsProp);
  const [rowsSource, setRowsSource] = useState(projectsProp);
  const hide = (id: "type" | "lead" | "client" | "email" | "xero" | "value" | "location") =>
    hiddenColumns.includes(id);
  // Reset optimistic rows when the filtered server list changes (React-recommended render sync).
  if (projectsProp !== rowsSource) {
    setRowsSource(projectsProp);
    setRows(projectsProp);
  }

  const groups = useMemo(() => {
    const all = boardGroups(rows);
    return hideEmptyGroups ? all.filter((g) => g.projects.length > 0) : all;
  }, [rows, hideEmptyGroups]);
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
  const [reviewProjectId, setReviewProjectId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ message: string; undo: (() => Promise<void>) | null } | null>(null);

  // Lead cells offer only the Person list (the global list); a project's old
  // free-text lead still shows on that row until someone picks from the list.
  const leads = useMemo(
    () => (leadSuggestions.length ? leadSuggestions : mergeLeadSuggestions([])),
    [leadSuggestions],
  );

  const patchRow = (next: BoardProject) => {
    setRows((current) => current.map((p) => (p.id === next.id ? { ...p, ...next } : p)));
  };

  const peek = peekId ? rows.find((p) => p.id === peekId) ?? null : null;

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

  // Keep Payment sticky offset and sticky stage/add row width in sync with the scroller.
  useEffect(() => {
    const sheet = sheetRef.current;
    const scroll = scrollRef.current;
    const th = projectThRef.current;
    if (!sheet || !scroll) return;
    const sync = () => {
      if (th) sheet.style.setProperty("--col-project", `${Math.round(th.getBoundingClientRect().width)}px`);
      sheet.style.setProperty("--ops-scroll-width", `${scroll.clientWidth}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(scroll);
    if (th) ro.observe(th);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [hiddenColumns, rows.length, frozen]);

  const colSpan = 3 + (7 - hiddenColumns.length);

  const visibleIds = rows.map((p) => p.id);
  const selectedProjects = rows.filter((p) => selected.has(p.id));
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const idsValue = selectedProjects.map((p) => p.id).join(",");
  const singleUnlinked = selectedProjects.length === 1 && !isLinkedToXero(selectedProjects[0]) ? selectedProjects[0] : null;
  const singleSelected = selectedProjects.length === 1 ? selectedProjects[0] : null;
  const reviewProject = reviewProjectId ? rows.find((p) => p.id === reviewProjectId) ?? null : null;

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

  const firstEditableGroup = PROJECT_GROUPS[0] ?? "awaiting";

  return (
    <div
      ref={sheetRef}
      className={`ops-sheet${frozen ? " ops-sheet--frozen" : ""}${hide("email") ? " ops-sheet--no-email" : ""}${selectedProjects.length > 0 && canEdit ? " ops-sheet--has-selection" : ""}`}
    >
      <div ref={scrollRef} className="ops-sheet__scroll">
        <table className="admin-table ops-table ops-board-table ops-sheet__table">
          <colgroup>
            <col className="ops-sheet__col-check" />
            <col className="ops-sheet__col-project" />
            <col className="ops-sheet__col-pay" />
            {!hide("type") ? <col className="ops-sheet__col-type" /> : null}
            {!hide("lead") ? <col className="ops-sheet__col-lead" /> : null}
            {!hide("client") ? <col className="ops-sheet__col-client" /> : null}
            {!hide("location") ? <col className="ops-sheet__col-location" /> : null}
            {!hide("xero") ? <col className="ops-sheet__col-xero" /> : null}
            {!hide("value") ? <col className="ops-sheet__col-value" /> : null}
            {!hide("email") ? <col className="ops-sheet__col-email" /> : null}
          </colgroup>
          <thead>
            <tr>
              <th className="ops-sheet__c-check ops-sheet__sticky" scope="col">
                <span className="sr-only">Select</span>
                {canEdit ? (
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all projects" />
                ) : null}
              </th>
              <th ref={projectThRef} className="ops-sheet__c-project ops-sheet__sticky" scope="col">
                Project
              </th>
              <th className="ops-sheet__c-pay ops-sheet__sticky" scope="col">
                Payment
              </th>
              {!hide("type") ? (
                <th className="ops-sheet__c-type" scope="col">
                  Type
                </th>
              ) : null}
              {!hide("lead") ? (
                <th className="ops-sheet__c-lead" scope="col">
                  Lead
                </th>
              ) : null}
              {!hide("client") ? (
                <th className="ops-sheet__c-client" scope="col">
                  Client
                </th>
              ) : null}
              {!hide("location") ? (
                <th className="ops-sheet__c-location" scope="col">
                  Location
                </th>
              ) : null}
              {!hide("xero") ? (
                <th className="ops-sheet__c-xero" scope="col">
                  Xero
                </th>
              ) : null}
              {!hide("value") ? (
                <th className="ops-sheet__c-value" scope="col">
                  Value
                </th>
              ) : null}
              {!hide("email") ? (
                <th className="ops-sheet__c-email" scope="col">
                  Email
                </th>
              ) : null}
            </tr>
          </thead>
          {groups.map(({ group, projects: rows }) => {
            const open = !collapsed.includes(group);
            return (
              <tbody key={group} className={`ops-sheet__group ops-sheet__group--${group}${open ? "" : " is-collapsed"}`}>
                <tr className="ops-sheet__group-row">
                  <th colSpan={colSpan} scope="colgroup">
                    <div className="ops-sheet__sticky-row">
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
                    </div>
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
                          <TitleCell project={p} canEdit={canEdit} onPeek={() => setPeekId(p.id)} onPatched={patchRow} />
                        </td>
                        <td className="ops-sheet__c-pay ops-sheet__sticky" data-label="Payment">
                          <PaymentEditCell project={p} canEdit={canEdit} onPatched={patchRow} />
                        </td>
                        {!hide("type") ? (
                          <td className="ops-sheet__c-type" data-label="Type">
                            <ServiceEditCell project={p} canEdit={canEdit} onPatched={patchRow} />
                          </td>
                        ) : null}
                        {!hide("lead") ? (
                          <td className="ops-sheet__c-lead" data-label="Lead">
                            <LeadCell project={p} canEdit={canEdit} suggestions={leads} onPatched={patchRow} />
                          </td>
                        ) : null}
                        {!hide("client") ? (
                          <td className="ops-sheet__c-client" data-label="Client">
                            <ClientEditCell project={p} canEdit={canEdit} onPatched={patchRow} />
                          </td>
                        ) : null}
                        {!hide("location") ? (
                          <td className="ops-sheet__c-location" data-label="Location">
                            <LocationEditCell
                              project={p}
                              canEdit={canEdit}
                              display={formatLocationCell(p)}
                              onPatched={patchRow}
                            />
                          </td>
                        ) : null}
                        {!hide("xero") ? (
                          <td className="ops-sheet__c-xero" data-label="Xero">
                            <XeroEditCell project={p} canEdit={canEdit} onPatched={patchRow} />
                          </td>
                        ) : null}
                        {!hide("value") ? (
                          <td className="ops-sheet__c-value" data-label="Value">
                            <ValueEditCell project={p} canEdit={canEdit} onPatched={patchRow} />
                          </td>
                        ) : null}
                        {!hide("email") ? (
                          <td className="ops-sheet__c-email" data-label="Email">
                            <EmailEditCell project={p} canEdit={canEdit} onPatched={patchRow} />
                          </td>
                        ) : null}
                      </tr>
                    ))
                  : null}
                {open ? (
                  <AddProjectRow
                    group={group}
                    canEdit={canEdit}
                    autoFocus={focusAdd && group === firstEditableGroup}
                    onAddFromXero={() => void openXeroPicker({ group })}
                    colSpan={colSpan}
                  />
                ) : null}
              </tbody>
            );
          })}
        </table>
      </div>

      {flash ? (
        <p className="ops-sheet__flash" role="status">
          {flash.message}
          {flash.undo ? (
            <>
              {" "}
              <button
                type="button"
                className="ops-sheet__flash-undo"
                onClick={() => {
                  const undo = flash.undo;
                  setFlash(null);
                  void undo?.();
                }}
              >
                Undo
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      {selectedProjects.length > 0 && canEdit ? (
        <SelectionBar
          count={selectedProjects.length}
          idsValue={idsValue}
          onExport={() => downloadCsv(selectedProjects)}
          onClear={() => setSelected(new Set())}
          linkToXero={
            singleUnlinked ? () => void openXeroPicker({ linkId: singleUnlinked.id }) : null
          }
          onFromXero={() => {
            if (singleSelected) setReviewProjectId(singleSelected.id);
          }}
          fromXeroEnabled={Boolean(singleSelected)}
        />
      ) : null}

      {reviewProject ? (
        <FromXeroReviewCard
          project={reviewProject}
          open
          onClose={() => setReviewProjectId(null)}
          onApplied={(patch, message, undo) => {
            patchRow({ ...reviewProject, ...patch } as BoardProject);
            setFlash({ message, undo });
            setSelected(new Set());
          }}
        />
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
        existingKeys={rows.map(
          (p) => `${(p.customer_name ?? "").trim().toLowerCase()}|${(p.title ?? "").trim().toLowerCase()}`,
        )}
      />

      <ProjectPeekDrawer
        project={peek}
        leadSuggestions={leads}
        onClose={() => setPeekId(null)}
        onPatched={patchRow}
        onLinkXero={
          peek && !isLinkedToXero(peek)
            ? () => {
                void openXeroPicker({ linkId: peek.id });
              }
            : undefined
        }
      />
    </div>
  );
}
