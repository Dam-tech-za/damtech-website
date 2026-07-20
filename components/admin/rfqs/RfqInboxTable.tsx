"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { RfqInboxRow, RfqOptionalColumnId } from "@/lib/admin/rfqs/rfq-inbox-types";
import { buildFilterParams } from "@/lib/admin/rfqs/rfq-inbox-utils";
import type { RfqInboxFilters } from "@/lib/admin/rfqs/rfq-inbox-types";
import { RfqBulkActions } from "./RfqBulkActions";
import { RfqColumnChooser, loadOptionalColumns } from "./RfqColumnChooser";
import { RfqInboxCard } from "./RfqInboxCard";
import { RfqInboxTableRow } from "./RfqInboxRow";

type StaffMember = {
  id: string;
  email: string;
  full_name: string | null;
};

type RfqInboxTableProps = {
  rows: RfqInboxRow[];
  filters: RfqInboxFilters;
  total: number;
  totalUnfiltered: number;
  page: number;
  pageSize: number;
  totalPages: number;
  showContact: boolean;
  canManage: boolean;
  staff: StaffMember[];
  bulkStatusAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  bulkAssignAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  refreshedAt: string;
};

export function RfqInboxTable({
  rows,
  filters,
  total,
  totalUnfiltered,
  page,
  pageSize,
  totalPages,
  showContact,
  canManage,
  staff,
  bulkStatusAction,
  bulkAssignAction,
  refreshedAt,
}: RfqInboxTableProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [optionalColumns, setOptionalColumns] = useState<RfqOptionalColumnId[]>(
    () => (typeof window !== "undefined" ? loadOptionalColumns() : []),
  );

  const rowIds = useMemo(() => new Set(rows.map((row) => row.id)), [rows]);
  const effectiveSelected = selected.filter((id) => rowIds.has(id));

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.length === rows.length ? [] : rows.map((row) => row.id),
    );
  }

  const hasFilters = total !== totalUnfiltered;
  const countLabel = hasFilters
    ? `${total} of ${totalUnfiltered} RFQs`
    : `${total} RFQ${total === 1 ? "" : "s"}`;

  return (
    <section className="rfq-inbox-panel">
      <header className="rfq-inbox-panel__header">
        <div>
          <p className="rfq-inbox-panel__count">{countLabel}</p>
          <p className="rfq-inbox-panel__refreshed">Last refreshed {refreshedAt}</p>
        </div>
        <RfqColumnChooser visible={optionalColumns} onChange={setOptionalColumns} />
      </header>

      <RfqBulkActions
        selectedCount={effectiveSelected.length}
        totalOnPage={rows.length}
        staff={staff}
        selectedIds={effectiveSelected}
        allSelected={
          effectiveSelected.length === rows.length && rows.length > 0
        }
        onClear={() => setSelected([])}
        onToggleAll={toggleAll}
        bulkStatusAction={async (formData) => {
          const result = await bulkStatusAction(formData);
          if (result.ok) setSelected([]);
          return result;
        }}
        bulkAssignAction={async (formData) => {
          const assigned = String(formData.get("assignedTo") ?? "");
          if (assigned === "__unassigned__") {
            formData.set("assignedTo", "");
          }
          const result = await bulkAssignAction(formData);
          if (result.ok) setSelected([]);
          return result;
        }}
      />

      <div className="rfq-inbox-table-wrap">
        <table className="admin-table rfq-inbox-table">
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Select</span>
              </th>
              {optionalColumns.includes("rfqNumber") ? (
                <th scope="col">RFQ</th>
              ) : null}
              <th scope="col">Customer</th>
              <th scope="col">Contact</th>
              <th scope="col">Location</th>
              <th scope="col">Service / project</th>
              <th scope="col">Approximate size</th>
              <th scope="col">Status</th>
              <th scope="col">Submitted</th>
              {optionalColumns.includes("lastUpdated") ? (
                <th scope="col">Last updated</th>
              ) : null}
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <RfqInboxTableRow
                key={row.id}
                row={row}
                selected={effectiveSelected.includes(row.id)}
                onToggle={toggle}
                showContact={showContact}
                optionalColumns={optionalColumns}
                canManage={canManage}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="rfq-inbox-cards">
        {rows.map((row) => (
          <RfqInboxCard
            key={row.id}
            row={row}
            selected={effectiveSelected.includes(row.id)}
            onToggle={toggle}
            showContact={showContact}
            canManage={canManage}
          />
        ))}
      </div>

      <RfqInboxPagination
        filters={filters}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
      />
    </section>
  );
}

function RfqInboxPagination({
  filters,
  page,
  pageSize,
  total,
  totalPages,
}: {
  filters: RfqInboxFilters;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav className="rfq-pagination" aria-label="RFQ pagination">
      <p className="rfq-pagination__summary">
        Showing {from}–{to} of {total}
      </p>
      <div className="rfq-pagination__controls">
        {page > 1 ? (
          <PaginationLink filters={filters} page={page - 1} label="Previous" />
        ) : (
          <span className="rfq-pagination__disabled">Previous</span>
        )}
        {totalPages <= 7 ? (
          Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <PaginationLink
              key={p}
              filters={filters}
              page={p}
              label={String(p)}
              active={p === page}
            />
          ))
        ) : (
          <>
            <PaginationLink filters={filters} page={1} label="1" active={page === 1} />
            {page > 3 ? <span aria-hidden>…</span> : null}
            {[page - 1, page, page + 1]
              .filter((p) => p > 1 && p < totalPages)
              .map((p) => (
                <PaginationLink
                  key={p}
                  filters={filters}
                  page={p}
                  label={String(p)}
                  active={p === page}
                />
              ))}
            {page < totalPages - 2 ? <span aria-hidden>…</span> : null}
            <PaginationLink
              filters={filters}
              page={totalPages}
              label={String(totalPages)}
              active={page === totalPages}
            />
          </>
        )}
        {page < totalPages ? (
          <PaginationLink filters={filters} page={page + 1} label="Next" />
        ) : (
          <span className="rfq-pagination__disabled">Next</span>
        )}
      </div>
      <form className="rfq-pagination__size" method="get">
        {Object.entries(filters)
          .filter(([key, value]) => Boolean(value?.trim()) && key !== "pageSize" && key !== "page")
          .map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        <label htmlFor="rfq-page-size">Page size</label>
        <select
          id="rfq-page-size"
          name="pageSize"
          className="form-input"
          defaultValue={String(pageSize)}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          {[25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </form>
    </nav>
  );
}

function PaginationLink({
  filters,
  page,
  label,
  active,
}: {
  filters: RfqInboxFilters;
  page: number;
  label: string;
  active?: boolean;
}) {
  const params = buildFilterParams(filters, ["page"]);
  params.set("page", String(page));
  return (
    <Link
      href={`/admin/rfqs/?${params.toString()}`}
      className={`admin-pagination__link${active ? " is-active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
