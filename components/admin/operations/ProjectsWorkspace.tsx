"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  PAYMENT_LABEL_TEXT,
  PROJECT_GROUPS,
  groupForStage,
  kmForOffice,
  matchesDistanceBand,
  matchesPriceBand,
  matchesPriceRange,
  matchesSearch,
  sortProjects,
  type BoardFilters,
  type ProjectGroup,
} from "@/lib/operations/board";
import { mergeLeadSuggestions } from "@/lib/operations/board-meta";
import { formatLocationCell } from "@/lib/operations/distance";
import type { BoardProject } from "@/lib/operations/queries";
import {
  BoardToolbar,
  type BoardColumnId,
  type BoardToolbarState,
} from "./BoardToolbar";
import { ProjectsBoard } from "./ProjectsBoard";
import { ProjectsMobileList } from "./ProjectsMobileList";

type Props = {
  projects: BoardProject[];
  canEdit: boolean;
  focusAdd: boolean;
  initial: BoardFilters;
};

const FREEZE_KEY = "ops-board-freeze-columns";
const FREEZE_EVENT = "ops-board-freeze";
const COLLAPSE_KEY = "ops-board-collapsed-groups";
const COLLAPSE_EVENT = "ops-board-collapsed";

function subscribeFreeze(onStoreChange: () => void) {
  window.addEventListener(FREEZE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(FREEZE_EVENT, onStoreChange);
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
  const header = ["Project", "Lead", "Payment", "Client", "Email", "Xero", "Value", "Location"];
  const lines = [
    header.join(","),
    ...projects.map((p) =>
      [
        p.title,
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

export function ProjectsWorkspace({ projects, canEdit, focusAdd, initial }: Props) {
  const [toolbar, setToolbar] = useState<BoardToolbarState>({
    q: initial.q ?? "",
    leads: initial.lead ? [initial.lead] : [],
    payments: initial.payment ? [initial.payment] : [],
    price: initial.price ?? "",
    priceMin: initial.price_min ?? "",
    priceMax: initial.price_max ?? "",
    office: initial.office ?? "",
    distance: initial.distance ?? "",
    stageGroup: initial.stage ?? "",
    sort: initial.sort ?? "created",
    sortDir: "asc",
    hiddenColumns: [],
  });
  const [focusNew, setFocusNew] = useState(false);

  const freezeRaw = useSyncExternalStore(subscribeFreeze, getFreezeRaw, () => "1");
  const frozen = freezeRaw !== "0";

  const leads = useMemo(() => mergeLeadSuggestions(projects.map((p) => p.leadName)), [projects]);

  const visible = useMemo(() => {
    const filtered = projects.filter((p) => {
      if (p.archived_at) return false;
      if (!matchesSearch(p, toolbar.q)) return false;
      if (toolbar.stageGroup) {
        const g = toolbar.stageGroup as ProjectGroup;
        if (!PROJECT_GROUPS.includes(g) || groupForStage(p.stage) !== g) return false;
      }
      if (toolbar.payments.length) {
        const match = toolbar.payments.some((pay) =>
          pay === "overdue" ? p.payment.overdue : p.payment.label === pay,
        );
        if (!match) return false;
      }
      if (toolbar.leads.length && !toolbar.leads.includes(p.leadName ?? "")) return false;
      if (!matchesPriceBand(p.quoted_total_incl_vat, toolbar.price)) return false;
      if (!matchesPriceRange(p.quoted_total_incl_vat, toolbar.priceMin, toolbar.priceMax)) return false;
      if (!matchesDistanceBand(kmForOffice(p, toolbar.office), toolbar.distance)) return false;
      return true;
    });
    const sorted = sortProjects(
      filtered,
      toolbar.sort === "next_action" ? "next_action" : toolbar.sort,
      toolbar.office,
    );
    return toolbar.sortDir === "desc" ? [...sorted].reverse() : sorted;
  }, [projects, toolbar]);

  const filterActive = Boolean(
    toolbar.stageGroup ||
      toolbar.payments.length ||
      toolbar.leads.length ||
      toolbar.price ||
      toolbar.priceMin ||
      toolbar.priceMax ||
      toolbar.distance ||
      toolbar.q,
  );

  const writeCollapsed = (next: ProjectGroup[]) => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
    } catch {
      // Private mode.
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  };

  const setFrozen = (next: boolean) => {
    try {
      window.localStorage.setItem(FREEZE_KEY, next ? "1" : "0");
    } catch {
      // Private mode.
    }
    window.dispatchEvent(new Event(FREEZE_EVENT));
  };

  const clearAll = () => {
    setToolbar({
      q: "",
      leads: [],
      payments: [],
      price: "",
      priceMin: "",
      priceMax: "",
      office: "",
      distance: "",
      stageGroup: "",
      sort: "created",
      sortDir: "asc",
      hiddenColumns: toolbar.hiddenColumns,
    });
  };

  return (
    <div className="ops-workspace">
      {/* Phones get their own compact table; the desktop board below is hidden there by CSS only. */}
      <ProjectsMobileList
        projects={visible}
        leads={leads}
        state={toolbar}
        filterActive={filterActive}
        onChange={(patch) => setToolbar((s) => ({ ...s, ...patch }))}
        onClear={clearAll}
      />
      <div className="ops-workspace__desktop">
      <BoardToolbar
        state={toolbar}
        leads={leads}
        canEdit={canEdit}
        frozen={frozen}
        onChange={(patch) => setToolbar((s) => ({ ...s, ...patch }))}
        onClear={clearAll}
        onNewProject={() => {
          writeCollapsed([]);
          setFocusNew(true);
          window.setTimeout(() => setFocusNew(false), 500);
        }}
        onExpandAll={() => writeCollapsed([])}
        onCollapseAll={() => writeCollapsed([...PROJECT_GROUPS])}
        onToggleFreeze={() => setFrozen(!frozen)}
        onExportCsv={() => downloadCsv(visible)}
      />

      {visible.length === 0 && projects.length > 0 ? (
        <p className="ops-table__meta">No projects match these filters.</p>
      ) : null}

      <ProjectsBoard
        projects={visible}
        canEdit={canEdit}
        focusAdd={(focusAdd || focusNew) && canEdit}
        hideEmptyGroups={filterActive}
        leadSuggestions={leads}
        hiddenColumns={toolbar.hiddenColumns as BoardColumnId[]}
      />
      </div>
    </div>
  );
}
