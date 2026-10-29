"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { RFQ_INBOX_SORT_OPTIONS, type RfqInboxFilters } from "@/lib/admin/rfqs/rfq-inbox-types";
import { buildFilterParams, countActiveAdvancedFilters } from "@/lib/admin/rfqs/rfq-inbox-utils";
import {
  AdminToolbarPopover,
  ToolbarChevron,
  ToolbarIconFilter,
  ToolbarIconMore,
  ToolbarIconPerson,
  ToolbarIconSearch,
  ToolbarIconSort,
} from "@/components/admin/ui/AdminToolbar";
import { RfqAdvancedFiltersTrigger } from "./RfqAdvancedFilters";

type StaffMember = { id: string; email: string; full_name: string | null };

type Props = {
  filters: RfqInboxFilters;
  staff: StaffMember[];
  canManage: boolean;
  canExport: boolean;
  exportHref: string;
};

/**
 * The Enquiries toolbar, in the same one-row style as the projects board:
 * Log enquiry, Search, Person (assigned estimator), Filter, Sort and "…".
 * Everything is kept in the URL, so links and refreshes keep the view.
 */
export function RfqHeaderToolbar({ filters, staff, canManage, canExport, exportHref }: Props) {
  const router = useRouter();
  const searchId = useId();
  const [open, setOpen] = useState<null | "person" | "sort" | "more">(null);
  const [searchOpen, setSearchOpen] = useState(Boolean(filters.q));
  const [q, setQ] = useState(filters.q ?? "");
  const searchRef = useRef<HTMLInputElement>(null);
  const personBtn = useRef<HTMLButtonElement>(null);
  const sortBtn = useRef<HTMLButtonElement>(null);
  const moreBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const go = (patch: Partial<RfqInboxFilters>) => {
    const params = buildFilterParams({ ...filters, ...patch }, ["page"]);
    router.push(`/admin/rfqs/${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const assigned = filters.assigned ?? "";
  const sort = filters.sort ?? "submitted_desc";
  const filterCount = countActiveAdvancedFilters(filters) - (assigned ? 1 : 0);

  return (
    <div className="ops-toolbar rfq-toolbar">
      <div className="ops-toolbar__row" role="toolbar" aria-label="Enquiry tools">
        {canManage ? (
          <a className="ops-toolbar__primary" href="/quote/" target="_blank" rel="noopener">
            Log enquiry
          </a>
        ) : null}

        <form
          className={`ops-toolbar__search${searchOpen || filters.q ? " is-open" : ""}`}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: q.trim() || undefined });
          }}
        >
          <button
            type="button"
            className="ops-toolbar__btn"
            aria-expanded={searchOpen}
            aria-controls={searchId}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <ToolbarIconSearch />
            <span>Search</span>
          </button>
          <input
            id={searchId}
            ref={searchRef}
            className="ops-toolbar__search-input"
            type="search"
            value={q}
            placeholder="Name, phone, email, number or town"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                if (q) {
                  setQ("");
                  if (filters.q) go({ q: undefined });
                } else setSearchOpen(false);
              }
            }}
          />
        </form>

        <button
          ref={personBtn}
          type="button"
          className={`ops-toolbar__btn${assigned ? " is-active" : ""}`}
          aria-expanded={open === "person"}
          onClick={() => setOpen((v) => (v === "person" ? null : "person"))}
        >
          <ToolbarIconPerson />
          <span>Person</span>
          {assigned ? <span className="ops-toolbar__badge">1</span> : null}
        </button>

        <RfqAdvancedFiltersTrigger
          filters={filters}
          staff={staff}
          advancedCount={filterCount}
          trigger={{
            className: `ops-toolbar__btn${filterCount > 0 ? " is-active" : ""}`,
            content: (
              <>
                <ToolbarIconFilter />
                <span>Filter</span>
                <ToolbarChevron />
                {filterCount > 0 ? <span className="ops-toolbar__dot" aria-label={`${filterCount} filters`} /> : null}
              </>
            ),
          }}
        />

        <button
          ref={sortBtn}
          type="button"
          className={`ops-toolbar__btn${sort !== "submitted_desc" ? " is-active" : ""}`}
          aria-expanded={open === "sort"}
          onClick={() => setOpen((v) => (v === "sort" ? null : "sort"))}
        >
          <ToolbarIconSort />
          <span>Sort</span>
        </button>

        <button
          ref={moreBtn}
          type="button"
          className="ops-toolbar__btn ops-toolbar__btn--icon"
          aria-label="More enquiry actions"
          aria-expanded={open === "more"}
          onClick={() => setOpen((v) => (v === "more" ? null : "more"))}
        >
          <ToolbarIconMore />
        </button>
      </div>

      <AdminToolbarPopover open={open === "person"} anchorRef={personBtn} onClose={() => setOpen(null)}>
        <p className="ops-toolbar__popover-title">Assigned to</p>
        <ul className="ops-toolbar__radio-list">
          {[{ id: "", label: "Everyone" }, { id: "unassigned", label: "Unassigned" }, ...staff.map((s) => ({ id: s.id, label: s.full_name || s.email }))].map(
            (option) => (
              <li key={option.id || "all"}>
                <label>
                  <input
                    type="radio"
                    name="rfq-assigned"
                    checked={assigned === option.id}
                    onChange={() => {
                      setOpen(null);
                      go({ assigned: option.id || undefined });
                    }}
                  />
                  {option.label}
                </label>
              </li>
            ),
          )}
        </ul>
      </AdminToolbarPopover>

      <AdminToolbarPopover open={open === "sort"} anchorRef={sortBtn} onClose={() => setOpen(null)} width={220}>
        <p className="ops-toolbar__popover-title">Sort by</p>
        <ul className="ops-toolbar__radio-list">
          {RFQ_INBOX_SORT_OPTIONS.map((option) => (
            <li key={option.value}>
              <label>
                <input
                  type="radio"
                  name="rfq-sort"
                  checked={sort === option.value}
                  onChange={() => {
                    setOpen(null);
                    go({ sort: option.value === "submitted_desc" ? undefined : option.value });
                  }}
                />
                {option.label}
              </label>
            </li>
          ))}
        </ul>
      </AdminToolbarPopover>

      <AdminToolbarPopover open={open === "more"} anchorRef={moreBtn} onClose={() => setOpen(null)} width={200}>
        <ul className="ops-toolbar__menu-list">
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(null);
                router.refresh();
              }}
            >
              Refresh
            </button>
          </li>
          {canExport ? (
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(null);
                  window.location.href = exportHref;
                }}
              >
                Export CSV
              </button>
            </li>
          ) : null}
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(null);
                router.push("/admin/rfqs/");
              }}
            >
              Clear all filters
            </button>
          </li>
        </ul>
      </AdminToolbarPopover>
    </div>
  );
}
