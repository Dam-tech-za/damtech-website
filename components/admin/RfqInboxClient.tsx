"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { RFQ_STATUSES } from "@/lib/rfq/schema";

type Row = {
  id: string;
  rfq_number: string;
  status: string;
  submitted_at: string;
  updated_at: string;
  contact_name: string;
  company_name: string | null;
  service_required: string | null;
  province: string | null;
  project_location: string | null;
  sizeLabel: string;
  assignee_email?: string | null;
  attachment_count?: number;
};

type Props = {
  rows: Row[];
  bulkAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
};

export function RfqInboxClient({ rows, bulkAction }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

  function handleBulk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    for (const id of selected) formData.append("rfqIds", id);
    startTransition(async () => {
      const result = await bulkAction(formData);
      if (!result.ok) setError(result.error || "Bulk update failed.");
      else setSelected([]);
    });
  }

  return (
    <div className="admin-panel">
      <form onSubmit={handleBulk} className="admin-bulk-bar">
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={selected.length === rows.length && rows.length > 0}
            onChange={toggleAll}
          />
          Select page
        </label>
        <select name="status" className="form-input" defaultValue="reviewing" required>
          {RFQ_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="btn btn--md btn--primary"
          disabled={pending || selected.length === 0}
        >
          {pending ? "Updating…" : `Update ${selected.length} selected`}
        </button>
        {error ? <p className="form-error">{error}</p> : null}
      </form>

      <div className="admin-table-wrap admin-table-wrap--desktop">
        <table className="admin-table">
          <thead>
            <tr>
              <th />
              <th>RFQ</th>
              <th>Submitted</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Province</th>
              <th>Location</th>
              <th>Size</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(row.id)}
                    onChange={() => toggle(row.id)}
                  />
                </td>
                <td>
                  <Link href={`/admin/rfqs/${row.id}/`}>{row.rfq_number}</Link>
                </td>
                <td>{new Date(row.submitted_at).toLocaleString("en-ZA")}</td>
                <td>
                  {row.contact_name}
                  {row.company_name ? (
                    <span className="admin-muted"> · {row.company_name}</span>
                  ) : null}
                </td>
                <td>{row.service_required ?? "—"}</td>
                <td>{row.province ?? "—"}</td>
                <td>{row.project_location ?? "—"}</td>
                <td>{row.sizeLabel}</td>
                <td>
                  <span className={`admin-status admin-status--${row.status}`}>
                    {row.status}
                  </span>
                </td>
                <td>{row.assignee_email ?? "—"}</td>
                <td>{new Date(row.updated_at).toLocaleString("en-ZA")}</td>
                <td>
                  <Link href={`/admin/rfqs/${row.id}/`} className="admin-link">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card-list">
        {rows.map((row) => (
          <article key={row.id} className="admin-rfq-card">
            <header>
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={selected.includes(row.id)}
                  onChange={() => toggle(row.id)}
                />
                <Link href={`/admin/rfqs/${row.id}/`}>{row.rfq_number}</Link>
              </label>
              <span className={`admin-status admin-status--${row.status}`}>
                {row.status}
              </span>
            </header>
            <p>
              <strong>{row.contact_name}</strong>
              {row.company_name ? ` · ${row.company_name}` : ""}
            </p>
            <p className="admin-muted">
              {row.service_required ?? "Service TBD"} · {row.province ?? "Province TBD"}
            </p>
            <p className="admin-muted">
              {row.sizeLabel} · {new Date(row.submitted_at).toLocaleDateString("en-ZA")}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
