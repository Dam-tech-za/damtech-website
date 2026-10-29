"use client";

import { useState, useTransition } from "react";
import { AdminButton, AdminSelect } from "@/components/admin/ui";
import { sendEnquiriesToXeroAction } from "@/app/admin/rfqs/actions";
import { RFQ_QUICK_STATUSES } from "./RfqStatusCell";

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
  const [xeroPending, startXeroTransition] = useTransition();
  const [xeroMessage, setXeroMessage] = useState<string | null>(null);

  if (selectedCount === 0) {
    return (
      <div className="rfq-bulk-actions rfq-bulk-actions--hidden">
        <label className="admin-checkbox rfq-bulk-actions__select-all">
          <input
            type="checkbox"
            checked={allSelected && totalOnPage > 0}
            onChange={onToggleAll}
            aria-label="Select all enquiries on this page"
          />
          Select page
        </label>
      </div>
    );
  }

  return (
    <div className="rfq-bulk-actions" role="region" aria-label="Bulk actions">
      <p className="rfq-bulk-actions__summary">
        {selectedCount} {selectedCount === 1 ? "enquiry" : "enquiries"} selected
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
        <AdminSelect
          id="bulk-status"
          name="status"
          defaultValue=""
          required
        >
          <option value="" disabled>
            Status…
          </option>
          {RFQ_QUICK_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </AdminSelect>
        <AdminButton
          type="submit"
          variant="primary"
          disabled={statusPending || assignPending}
        >
          {statusPending ? "Updating…" : "Update"}
        </AdminButton>
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
        <AdminSelect id="bulk-assign" name="assignedTo" required defaultValue="">
          <option value="" disabled>
            Assign to…
          </option>
          <option value="__unassigned__">Unassigned</option>
          {staff.map((person) => (
            <option key={person.id} value={person.id}>
              {person.full_name || person.email}
            </option>
          ))}
        </AdminSelect>
        <AdminButton
          type="submit"
          variant="secondary"
          disabled={statusPending || assignPending}
        >
          {assignPending ? "Assigning…" : "Assign"}
        </AdminButton>
      </form>

      <AdminButton
        type="button"
        variant="secondary"
        disabled={xeroPending}
        onClick={() => {
          setXeroMessage(null);
          startXeroTransition(async () => {
            const result = await sendEnquiriesToXeroAction(selectedIds);
            setXeroMessage(result.message);
          });
        }}
      >
        {xeroPending ? "Sending…" : "Send to Xero"}
      </AdminButton>

      <AdminButton type="button" variant="secondary" onClick={onClear}>
        Clear selection
      </AdminButton>

      {xeroMessage ? <p className="rfq-bulk-actions__note">{xeroMessage}</p> : null}

      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
