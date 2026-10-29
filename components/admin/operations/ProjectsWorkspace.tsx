"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DISTANCE_BAND_LABELS,
  DISTANCE_BANDS,
  GROUP_LABELS,
  OFFICE_FILTER_LABELS,
  OFFICE_FILTERS,
  PAYMENT_LABEL_TEXT,
  PAYMENT_LABELS,
  PRICE_BAND_LABELS,
  PRICE_BANDS,
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
import type { BoardProject } from "@/lib/operations/queries";
import { BoardViewControls } from "./BoardViewControls";
import { ProjectsBoard } from "./ProjectsBoard";

type Props = {
  projects: BoardProject[];
  canEdit: boolean;
  focusAdd: boolean;
  initial: BoardFilters;
};

export function ProjectsWorkspace({ projects, canEdit, focusAdd, initial }: Props) {
  const [q, setQ] = useState(initial.q ?? "");
  const [lead, setLead] = useState(initial.lead ?? "");
  const [payment, setPayment] = useState(initial.payment ?? "");
  const [price, setPrice] = useState(initial.price ?? "");
  const [priceMin, setPriceMin] = useState(initial.price_min ?? "");
  const [priceMax, setPriceMax] = useState(initial.price_max ?? "");
  const [office, setOffice] = useState(initial.office ?? "");
  const [distance, setDistance] = useState(initial.distance ?? "");
  const [stageGroup, setStageGroup] = useState(initial.stage ?? "");
  const [sort, setSort] = useState<BoardFilters["sort"]>(initial.sort ?? "created");
  const [show, setShow] = useState(initial.show ?? "active");
  const [service, setService] = useState(initial.service ?? "");
  const [, startTransition] = useTransition();

  const leads = useMemo(() => mergeLeadSuggestions(projects.map((p) => p.leadName)), [projects]);

  const visible = useMemo(() => {
    const filtered = projects.filter((p) => {
      if (show === "active" && p.archived_at) return false;
      if (show === "completed" && p.stage !== "completed") return false;
      if (show === "archived" && !p.archived_at) return false;
      if (show === "active" && false) return false;
      if (!matchesSearch(p, q)) return false;
      if (service && p.service !== service) return false;
      if (stageGroup) {
        const g = stageGroup as ProjectGroup;
        if (!PROJECT_GROUPS.includes(g) || groupForStage(p.stage) !== g) return false;
      }
      if (payment) {
        if (payment === "overdue" ? !p.payment.overdue : p.payment.label !== payment) return false;
      }
      if (lead && (p.leadName ?? "") !== lead) return false;
      if (!matchesPriceBand(p.quoted_total_incl_vat, price)) return false;
      if (!matchesPriceRange(p.quoted_total_incl_vat, priceMin, priceMax)) return false;
      if (!matchesDistanceBand(kmForOffice(p, office), distance)) return false;
      return true;
    });
    return sortProjects(filtered, sort === "next_action" ? "next_action" : sort, office);
  }, [projects, q, lead, payment, price, priceMin, priceMax, office, distance, stageGroup, sort, show, service]);

  const filterActive = Boolean(stageGroup || payment || lead || price || priceMin || priceMax || distance || q);

  return (
    <div className="ops-workspace">
      <div className="ops-board-filters ops-board-filters--primary" role="search" aria-label="Project filters">
        <label className="ops-board-filters__search">
          <span className="sr-only">Search</span>
          <input
            className="admin-input"
            type="search"
            value={q}
            placeholder="Search customer, site, QU or INV"
            onChange={(e) => {
              const next = e.target.value;
              startTransition(() => setQ(next));
            }}
          />
        </label>
        <select
          className="admin-select"
          aria-label="Project lead"
          value={lead}
          onChange={(e) => setLead(e.target.value)}
        >
          <option value="">Any lead</option>
          {leads.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="admin-select"
          aria-label="Payment status"
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
        >
          <option value="">Any payment</option>
          {PAYMENT_LABELS.map((l) => (
            <option key={l} value={l}>
              {PAYMENT_LABEL_TEXT[l]}
            </option>
          ))}
          <option value="overdue">Overdue</option>
        </select>
        <select className="admin-select" aria-label="Price band" value={price} onChange={(e) => setPrice(e.target.value)}>
          <option value="">Any price band</option>
          {PRICE_BANDS.map((b) => (
            <option key={b} value={b}>
              {PRICE_BAND_LABELS[b]}
            </option>
          ))}
        </select>
        <label className="ops-price-range">
          <span className="sr-only">Minimum price</span>
          <input
            className="admin-input"
            type="number"
            min={0}
            step={1000}
            value={priceMin}
            placeholder="Min R"
            onChange={(e) => {
              const next = e.target.value;
              startTransition(() => setPriceMin(next));
            }}
          />
        </label>
        <label className="ops-price-range">
          <span className="sr-only">Maximum price</span>
          <input
            className="admin-input"
            type="number"
            min={0}
            step={1000}
            value={priceMax}
            placeholder="Max R"
            onChange={(e) => {
              const next = e.target.value;
              startTransition(() => setPriceMax(next));
            }}
          />
        </label>
        <select className="admin-select" aria-label="Office for distance" value={office} onChange={(e) => setOffice(e.target.value)}>
          <option value="">Nearest office</option>
          {OFFICE_FILTERS.map((o) => (
            <option key={o} value={o}>
              {OFFICE_FILTER_LABELS[o]}
            </option>
          ))}
        </select>
        <select className="admin-select" aria-label="Distance" value={distance} onChange={(e) => setDistance(e.target.value)}>
          <option value="">Any distance</option>
          {DISTANCE_BANDS.map((b) => (
            <option key={b} value={b}>
              {DISTANCE_BAND_LABELS[b]}
            </option>
          ))}
        </select>
        <select
          className="admin-select"
          aria-label="Stage"
          value={stageGroup}
          onChange={(e) => setStageGroup(e.target.value)}
        >
          <option value="">All stages</option>
          {PROJECT_GROUPS.map((g) => (
            <option key={g} value={g}>
              {GROUP_LABELS[g]}
            </option>
          ))}
        </select>
        <BoardViewControls />
      </div>

      <details className="ops-more-filters" open={Boolean(service || sort !== "created" || show !== "active")}>
        <summary>More filters</summary>
        <div className="ops-board-filters">
          <select className="admin-select" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as BoardFilters["sort"])}>
            <option value="created">Created (stable)</option>
            <option value="next_action">Next step date</option>
            <option value="name">Project name</option>
            <option value="lead">Project lead</option>
            <option value="price">Price (high to low)</option>
            <option value="distance">Distance</option>
            <option value="updated">Recently updated</option>
          </select>
          <select
            className="admin-select"
            aria-label="Which projects"
            value={show}
            onChange={(e) => setShow((e.target.value || "active") as "active" | "completed" | "archived")}
          >
            <option value="active">Active (incl. completed)</option>
            <option value="completed">Completed only</option>
            <option value="archived">Archived</option>
          </select>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => {
              setQ("");
              setLead("");
              setPayment("");
              setPrice("");
              setPriceMin("");
              setPriceMax("");
              setOffice("");
              setDistance("");
              setStageGroup("");
              setSort("created");
              setShow("active");
              setService("");
            }}
          >
            Clear
          </button>
        </div>
      </details>

      {visible.length === 0 && projects.length > 0 ? (
        <p className="ops-table__meta">No projects match these filters.</p>
      ) : null}

      <ProjectsBoard
        projects={visible}
        canEdit={canEdit}
        focusAdd={focusAdd}
        hideEmptyGroups={filterActive}
        leadSuggestions={leads}
      />
    </div>
  );
}
