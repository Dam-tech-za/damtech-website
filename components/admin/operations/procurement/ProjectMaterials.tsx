"use client";

import { useState } from "react";
import { AdminButton } from "@/components/admin/ui";
import { formatOpsDate, formatOpsMoney } from "@/components/admin/operations/ops-format";
import { MATERIAL_STATUS_LABELS } from "@/lib/operations/lifecycle";
import { costSummary, readinessIssue, deliveryLabel } from "@/lib/operations/procurement";
import type { ProcurementOrder } from "@/lib/operations/procurement-store";
import { OrderDrawer } from "./OrderDrawer";

type Props = {
  projectId: string;
  orders: ProcurementOrder[];
  canEdit: boolean;
  canApprove: boolean;
  today: string;
  installStart: string | null;
};

/** The project's supplier orders, cost by stage and anything that could delay the install. */
export function ProjectMaterials({ projectId, orders, canEdit, canApprove, today, installStart }: Props) {
  const [selected, setSelected] = useState<string | "new" | null>(null);
  const s = costSummary(orders.map((o) => ({ status: o.status, totals: o.totals, bills: o.bills })));
  const issues = orders.map((o) => ({ o, issue: readinessIssue(o, today, installStart) })).filter((x) => x.issue);
  const current = selected && selected !== "new" ? orders.find((o) => o.id === selected) ?? null : null;

  return (
    <div className="proc-project">
      <dl className="proc-costs">
        <div>
          <dt>Estimated</dt>
          <dd>{formatOpsMoney(s.estimatedExclVat)}<small>excl. VAT, quotes not yet ordered</small></dd>
        </div>
        <div>
          <dt>Committed</dt>
          <dd>{formatOpsMoney(s.committedExclVat)}<small>excl. VAT ({formatOpsMoney(s.committedInclVat)} incl.)</small></dd>
        </div>
        <div>
          <dt>Billed (Xero)</dt>
          <dd>{formatOpsMoney(s.billedInclVat)}<small>incl. VAT, {s.billCount} bill{s.billCount === 1 ? "" : "s"}</small></dd>
        </div>
        <div>
          <dt>Paid (Xero)</dt>
          <dd>{formatOpsMoney(s.paidInclVat)}<small>{formatOpsMoney(s.dueInclVat)} still due</small></dd>
        </div>
      </dl>

      {issues.length ? (
        <ul className="ops-cal-warnings" role="note" aria-label="Materials that could delay the installation">
          {issues.map(({ o, issue }) => (
            <li key={o.id}>{o.supplier_name}: {issue}</li>
          ))}
        </ul>
      ) : null}

      {orders.length ? (
        <table className="proc-table proc-table--main">
          <thead>
            <tr>
              <th scope="col">Supplier and materials</th>
              <th scope="col">Status</th>
              <th scope="col">Expected</th>
              <th scope="col">Delivered</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="proc-row" onClick={() => setSelected(o.id)}>
                <td data-label="Supplier and materials">
                  <button type="button" className="proc-row__open" onClick={(e) => { e.stopPropagation(); setSelected(o.id); }}>{o.supplier_name}</button>
                  <span className="proc-muted">{o.description}{o.documentCount ? ` · ${o.documentCount} doc${o.documentCount === 1 ? "" : "s"}` : ""}{o.bills.length ? ` · ${o.bills.length} Xero bill${o.bills.length === 1 ? "" : "s"}` : ""}</span>
                </td>
                <td data-label="Status"><span className={`proc-status proc-status--${o.status}`}>{MATERIAL_STATUS_LABELS[o.status]}</span></td>
                <td data-label="Expected">{formatOpsDate(o.expected_date)}</td>
                <td data-label="Delivered">{deliveryLabel(o.status, o.progress)}</td>
                <td data-label="Amount">{o.totals.priced || o.totals.exclVat ? formatOpsMoney(o.totals.inclVat) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="ops-cal-empty">No supplier orders yet.</p>
      )}

      {canEdit ? (
        <AdminButton size="sm" variant="primary" onClick={() => setSelected("new")}>Add supplier order</AdminButton>
      ) : null}

      {selected ? (
        <OrderDrawer
          key={selected}
          order={current}
          projectId={projectId}
          canEdit={canEdit}
          canApprove={canApprove}
          today={today}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
