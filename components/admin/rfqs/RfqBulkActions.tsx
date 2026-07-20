"use client";

import { useState, useTransition } from "react";
import { RFQ_STATUSES } from "@/lib/rfq/statuses";

type StaffMember = {
  id: string;
  email: string;
  full_name: string | null;
};

type RfqBulkActionsProps = {
  selectedCount: number;
  totalOnPage: number;
  staff: StaffMember[];
  onClear: () => void;
  onToggleAll: () => void;
  allSelected: boolean;
  bulkStatusAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  bulkAssignAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  selectedIds: string[];
};

export function RfqBulkActions({
  selectedCount,
  totalOnPage,
  staff,
  onClear,
  onToggleAll,
  allSelected,
  bulkStatusAction,
  bulkAssignAction,
  selectedIds,
}: RfqBulkActionsProps) {
  const [statusPending, startStatusTransition] = useTransition();
  const [assignPending, startAssignTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (selectedCount === 0) {
    return (
      <div className="rfq-bulk-actions rfq-bulk-actions--hidden">
        <label className="admin-checkbox rfq-bulk-actions__select-all">
          <input
            type="checkbox"
            checked={allSelected && totalOnPage > 0}
            onChange={onToggleAll}
            aria-label="Select all RFQs on this page"
          />
          Select page
        </label>
      </div>
    );
  }

  return (
    <div className="rfq-bulk-actions" role="region" aria-label="Bulk actions">
      <p className="rfq-bulk-actions__summary">
        {selectedCount} RFQ{selectedCount === 1 ? "" : "s"} selected
      </p>

      <form
        className="rfq-bulk-actions__form"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          for (const id of selectedIds) formData.append("rfqIds", id);
          setError(null);
          startStatusTransition(async () => {
            const result = await bulkStatusAction(formData);
            if (!result.ok) setError(result.error || "Bulk update failed.");
          });
        }}
      >
        <label className="sr-only" htmlFor="bulk-status">
          Status
        </label>
        <select
          id="bulk-status"
          name="status"
          className="form-input"
          defaultValue=""
          required
        >
          <option value="" disabled>
            Status…
          </option>
          {RFQ_STATUSES.filter((s) => s !== "archived" && s !== "converted").map(
            (status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ),
          )}
        </select>
        <button
          type="submit"
          className="btn btn--md btn--primary"
          disabled={statusPending || assignPending}
        >
          {statusPending ? "Updating…" : "Update"}
        </button>
      </form>

      <form
        className="rfq-bulk-actions__form"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          for (const id of selectedIds) formData.append("rfqIds", id);
          setError(null);
          startAssignTransition(async () => {
            const result = await bulkAssignAction(formData);
            if (!result.ok) setError(result.error || "Bulk assign failed.");
          });
        }}
      >
        <label className="sr-only" htmlFor="bulk-assign">
          Assign to
        </label>
        <select id="bulk-assign" name="assignedTo" className="form-input" required defaultValue="">
          <option value="" disabled>
            Assign to…
          </option>
          <option value="__unassigned__">Unassigned</option>
          {staff.map((person) => (
            <option key={person.id} value={person.id}>
              {person.full_name || person.email}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="btn btn--md btn--secondary"
          disabled={statusPending || assignPending}
        >
          {assignPending ? "Assigning…" : "Assign"}
        </button>
      </form>

      <button
        type="button"
        className="btn btn--md btn--secondary"
        onClick={onClear}
      >
        Clear selection
      </button>

      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
