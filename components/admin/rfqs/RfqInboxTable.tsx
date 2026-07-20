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
  canDelete: boolean;
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
  canDelete,
  staff,
  bulkStatusAction,
  bulkAssignAction,
  refreshedAt,
}: RfqInboxTableProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [optionalColumns, setOptionalColumns] = useState<RfqOptionalColumnId[]>(
    () => (typeof window !== "undefined" ? loadOptionalColumns() : []),
  );

  const visibleRows = useMemo(
    () => rows.filter((row) => !removedIds.includes(row.id)),
    [rows, removedIds],
  );

  const rowIds = useMemo(() => new Set(visibleRows.map((row) => row.id)), [visibleRows]);
  const effectiveSelected = selected.filter((id) => rowIds.has(id));

  function handleRowDeleted(id: string) {
    setRemovedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setSelected((prev) => prev.filter((rowId) => rowId !== id));
    setToastMessage("RFQ deleted successfully.");
    window.setTimeout(() => setToastMessage(null), 5000);
  }

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.length === visibleRows.length ? [] : visibleRows.map((row) => row.id),
    );
  }

  const hasFilters = total !== totalUnfiltered;
  const visibleTotal = Math.max(0, total - removedIds.length);
  const countLabel = hasFilters
    ? `${visibleTotal} of ${totalUnfiltered} RFQs`
    : `${visibleTotal} RFQ${visibleTotal === 1 ? "" : "s"}`;

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
        totalOnPage={visibleRows.length}
        staff={staff}
        selectedIds={effectiveSelected}
        allSelected={
          effectiveSelected.length === visibleRows.length && visibleRows.length > 0
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

      {toastMessage ? (
        <div className="rfq-delete-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}

      <div className="rfq-inbox-table-wrap">
        <table className="admin-table rfq-inbox-table">
          <colgroup>
            <col className="rfq-col-check" />
            {optionalColumns.includes("rfqNumber") ? (
              <col className="rfq-col-rfq" />
            ) : null}
            <col className="rfq-col-customer" />
            <col className="rfq-col-contact" />
            <col className="rfq-col-location" />
            <col className="rfq-col-service" />
            <col className="rfq-col-size" />
            <col className="rfq-col-status" />
            <col className="rfq-col-submitted" />
            {optionalColumns.includes("lastUpdated") ? (
              <col className="rfq-col-updated" />
            ) : null}
            <col className="rfq-col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="rfq-col-check">
                <span className="sr-only">Select</span>
              </th>
              {optionalColumns.includes("rfqNumber") ? (
                <th scope="col" className="rfq-col-rfq">
                  RFQ
                </th>
              ) : null}
              <th scope="col" className="rfq-col-customer">
                Customer
              </th>
              <th scope="col" className="rfq-col-contact">
                Contact
              </th>
              <th scope="col" className="rfq-col-location">
                Location
              </th>
              <th scope="col" className="rfq-col-service">
                Service / project
              </th>
              <th scope="col" className="rfq-col-size">
                Approx. size
              </th>
              <th scope="col" className="rfq-col-status">
                Status
              </th>
              <th scope="col" className="rfq-col-submitted">
                Submitted
              </th>
              {optionalColumns.includes("lastUpdated") ? (
                <th scope="col" className="rfq-col-updated">
                  Last updated
                </th>
              ) : null}
              <th scope="col" className="rfq-col-actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <RfqInboxTableRow
                key={row.id}
                row={row}
                selected={effectiveSelected.includes(row.id)}
                onToggle={toggle}
                showContact={showContact}
                optionalColumns={optionalColumns}
                canManage={canManage}
                canDelete={canDelete}
                onDeleted={() => handleRowDeleted(row.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="rfq-inbox-cards">
        {visibleRows.map((row) => (
          <RfqInboxCard
            key={row.id}
            row={row}
            selected={effectiveSelected.includes(row.id)}
            onToggle={toggle}
            showContact={showContact}
            canManage={canManage}
            canDelete={canDelete}
            onDeleted={() => handleRowDeleted(row.id)}
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
