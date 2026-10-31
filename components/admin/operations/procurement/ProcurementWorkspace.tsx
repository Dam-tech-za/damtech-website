"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminButton } from "@/components/admin/ui";
import { formatOpsDate, formatOpsMoney } from "@/components/admin/operations/ops-format";
import { MATERIAL_STATUS_LABELS } from "@/lib/operations/lifecycle";
import { ORDER_STATUS_CHOICES, costSummary, isOrderOpen, isOrderPlaced, deliveryLabel } from "@/lib/operations/procurement";
import type { ProcurementOrder } from "@/lib/operations/procurement-store";
import { OrderDrawer, type ProjectChoice } from "./OrderDrawer";

type Props = {
  orders: ProcurementOrder[];
  projects: ProjectChoice[];
  canEdit: boolean;
  canApprove: boolean;
  today: string;
  includeClosed: boolean;
  closedHref: string;
};

type Quick = "all" | "approval" | "overdue" | "week" | "partial" | "bills" | "attention";
type SortKey = "expected" | "supplier" | "project" | "amount" | "status";

const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};

function billSummary(o: ProcurementOrder): { label: string; tone: string } {
  if (!o.bills.length) return { label: isOrderPlaced(o.status) ? "No bill linked" : "—", tone: "muted" };
  const due = o.bills.reduce((s, b) => s + (b.amount_due ?? 0), 0);
  return due > 0 ? { label: `${formatOpsMoney(due)} due`, tone: "warn" } : { label: "Paid (Xero)", tone: "ok" };
}

export function ProcurementWorkspace({ orders, projects, canEdit, canApprove, today, includeClosed, closedHref }: Props) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [project, setProject] = useState("");
  const [lead, setLead] = useState("");
  const [quick, setQuick] = useState<Quick>("all");
  const [sort, setSort] = useState<SortKey>("expected");
  const [limit, setLimit] = useState(50);
  const [selected, setSelected] = useState<string | "new" | null>(null);

  const weekEnd = addDays(today, 7);
  const isOverdue = (o: ProcurementOrder) => isOrderOpen(o.status) && isOrderPlaced(o.status) && Boolean(o.expected_date && o.expected_date < today);
  const buckets: Record<Exclude<Quick, "all">, (o: ProcurementOrder) => boolean> = {
    approval: (o) => o.status === "quoted",
    overdue: isOverdue,
    week: (o) => isOrderOpen(o.status) && Boolean(o.expected_date && o.expected_date >= today && o.expected_date <= weekEnd),
    partial: (o) => o.status === "partially_received" || o.progress.state === "partial",
    bills: (o) => o.bills.some((b) => (b.amount_due ?? 0) > 0),
    attention: (o) => o.status === "problem" || o.status === "on_hold",
  };
  const counts = Object.fromEntries(Object.entries(buckets).map(([k, f]) => [k, orders.filter(f).length])) as Record<Exclude<Quick, "all">, number>;

  const leads = useMemo(() => [...new Set(orders.map((o) => o.project.lead).filter(Boolean) as string[])].sort(), [orders]);
  const projectOptions = useMemo(() => [...new Map(orders.map((o) => [o.project_id, o.project.title])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [orders]);

  const needle = q.trim().toLowerCase();
  const rows = orders
    .filter((o) => quick === "all" || buckets[quick](o))
    .filter((o) => !status || o.status === status)
    .filter((o) => !project || o.project_id === project)
    .filter((o) => !lead || o.project.lead === lead)
    .filter(
      (o) =>
        !needle ||
        [o.supplier_name, o.description, o.project.title, o.project.customer_name, o.order_reference, o.supplier_reference, ...o.lines.map((l) => l.description), ...o.bills.map((b) => b.bill_number)]
          .some((v) => v?.toLowerCase().includes(needle)),
    )
    .sort((a, b) => {
      switch (sort) {
        case "supplier":
          return a.supplier_name.localeCompare(b.supplier_name);
        case "project":
          return a.project.title.localeCompare(b.project.title);
        case "amount":
          return b.totals.inclVat - a.totals.inclVat;
        case "status":
          return ORDER_STATUS_CHOICES.indexOf(a.status) - ORDER_STATUS_CHOICES.indexOf(b.status);
        default:
          return (a.expected_date ?? "9999").localeCompare(b.expected_date ?? "9999");
      }
    });

  const summary = costSummary(orders.map((o) => ({ status: o.status, totals: o.totals, bills: o.bills })));
  const current = selected && selected !== "new" ? orders.find((o) => o.id === selected) ?? null : null;

  const tiles: { key: Exclude<Quick, "all">; label: string }[] = [
    { key: "approval", label: "Quotes to approve" },
    { key: "overdue", label: "Overdue deliveries" },
    { key: "week", label: "Due in 7 days" },
    { key: "partial", label: "Part delivered" },
    { key: "bills", label: "Bills with money due" },
    { key: "attention", label: "Problems / on hold" },
  ];

  return (
    <div className="proc">
      <div className="proc-tiles" role="group" aria-label="Quick filters">
        <button type="button" className={`proc-tile${quick === "all" ? " is-active" : ""}`} aria-pressed={quick === "all"} onClick={() => setQuick("all")}>
          <strong>{orders.filter((o) => isOrderOpen(o.status)).length}</strong>
          <span>Open orders</span>
        </button>
        {tiles.map((t) => (
          <button key={t.key} type="button" className={`proc-tile${quick === t.key ? " is-active" : ""}${counts[t.key] && (t.key === "overdue" || t.key === "attention") ? " is-bad" : ""}`} aria-pressed={quick === t.key} onClick={() => setQuick(quick === t.key ? "all" : t.key)}>
            <strong>{counts[t.key]}</strong>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <p className="proc-summary">
        Committed {formatOpsMoney(summary.committedInclVat)} incl. VAT · Billed in Xero {formatOpsMoney(summary.billedInclVat)} · Paid {formatOpsMoney(summary.paidInclVat)} · Due {formatOpsMoney(summary.dueInclVat)}
        <span className="proc-muted"> (shown orders; stages of the same spend, not added together)</span>
      </p>

      <div className="proc-filters" role="search" aria-label="Filter supplier orders">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search supplier, material, project, reference or bill" aria-label="Search orders" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {ORDER_STATUS_CHOICES.map((s) => (
            <option key={s} value={s}>{MATERIAL_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select value={project} onChange={(e) => setProject(e.target.value)} aria-label="Project">
          <option value="">All projects</option>
          {projectOptions.map(([id, title]) => (
            <option key={id} value={id}>{title}</option>
          ))}
        </select>
        <select value={lead} onChange={(e) => setLead(e.target.value)} aria-label="Project lead">
          <option value="">All leads</option>
          {leads.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort by">
          <option value="expected">Sort: expected date</option>
          <option value="supplier">Sort: supplier</option>
          <option value="project">Sort: project</option>
          <option value="amount">Sort: amount</option>
          <option value="status">Sort: status</option>
        </select>
        <Link className="proc-link" href={closedHref}>{includeClosed ? "Hide received and cancelled" : "Show received and cancelled"}</Link>
        {canEdit ? <AdminButton size="sm" variant="primary" onClick={() => setSelected("new")}>New order</AdminButton> : null}
      </div>

      {rows.length ? (
        <div className="proc-table-wrap">
          <table className="proc-table proc-table--main">
            <thead>
              <tr>
                <th scope="col">Supplier and materials</th>
                <th scope="col">Project</th>
                <th scope="col">Status</th>
                <th scope="col">Expected</th>
                <th scope="col">Delivered</th>
                <th scope="col">Amount</th>
                <th scope="col">Xero bill</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((o) => {
                const bill = billSummary(o);
                return (
                  <tr key={o.id} className="proc-row" onClick={() => setSelected(o.id)}>
                    <td data-label="Supplier and materials">
                      <button type="button" className="proc-row__open" onClick={(e) => { e.stopPropagation(); setSelected(o.id); }}>
                        {o.supplier_name}
                      </button>
                      <span className="proc-muted">
                        {o.description}
                        {o.order_reference ? ` · ${o.order_reference}` : ""}
                        {o.documentCount ? ` · ${o.documentCount} doc${o.documentCount === 1 ? "" : "s"}` : ""}
                      </span>
                    </td>
                    <td data-label="Project">
                      <Link href={`/admin/operations/projects/${o.project_id}/?tab=materials`} onClick={(e) => e.stopPropagation()}>{o.project.title}</Link>
                      {o.project.lead ? <span className="proc-muted">Lead: {o.project.lead}</span> : null}
                    </td>
                    <td data-label="Status"><span className={`proc-status proc-status--${o.status}`}>{MATERIAL_STATUS_LABELS[o.status]}</span></td>
                    <td data-label="Expected">
                      {formatOpsDate(o.expected_date)}
                      {isOverdue(o) ? <span className="proc-warn"> Late</span> : null}
                      {o.required_on_site ? <span className="proc-muted">Needed {formatOpsDate(o.required_on_site)}</span> : null}
                    </td>
                    <td data-label="Delivered">{deliveryLabel(o.status, o.progress)}</td>
                    <td data-label="Amount">{o.totals.priced || o.totals.exclVat ? formatOpsMoney(o.totals.inclVat) : "—"}</td>
                    <td data-label="Xero bill"><span className={`proc-${bill.tone}`}>{bill.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length > limit ? (
            <AdminButton variant="ghost" size="sm" onClick={() => setLimit((l) => l + 50)}>Show {Math.min(50, rows.length - limit)} more</AdminButton>
          ) : null}
        </div>
      ) : (
        <p className="proc-empty">{orders.length ? "No orders match these filters." : "No supplier orders yet. Add one from a project's Materials section, or with New order."}</p>
      )}

      {selected ? (
        <OrderDrawer
          key={selected}
          order={current}
          projects={projects}
          canEdit={canEdit}
          canApprove={canApprove}
          today={today}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
