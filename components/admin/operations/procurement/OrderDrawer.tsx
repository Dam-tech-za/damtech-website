"use client";

import Link from "next/link";
import { startTransition, useActionState, useCallback, useEffect, useState } from "react";
import type { AdminActionState } from "@/lib/admin/action-state";
import { AdminActionMessage, AdminButton, AdminDrawer } from "@/components/admin/ui";
import { FULFILMENT_LABELS, MATERIAL_STATUS_LABELS } from "@/lib/operations/lifecycle";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
  ORDER_STATUS_CHOICES,
  lineOutstanding,
  lineTotalExclVat,
} from "@/lib/operations/procurement";
import type { OrderDocument, OrderReceipt, ProcurementOrder } from "@/lib/operations/procurement-store";
import { MATERIAL_FULFILMENT } from "@/lib/operations/types";
import { formatOpsDate, formatOpsDateTime, formatOpsMoney } from "@/components/admin/operations/ops-format";
import {
  deleteLineAction,
  documentLinkAction,
  finishUploadAction,
  linkBillAction,
  orderExtrasAction,
  prepareUploadAction,
  recordReceiptAction,
  refreshBillsAction,
  reverseReceiptAction,
  saveLineAction,
  saveOrderAction,
  searchBillsAction,
  unlinkBillAction,
  type BillOption,
} from "@/app/admin/operations/procurement/actions";

export type ProjectChoice = { id: string; title: string };

type Props = {
  /** Existing order, or null to create one. */
  order: ProcurementOrder | null;
  /** Fixed project when opened from a project page. */
  projectId?: string;
  projects?: ProjectChoice[];
  canEdit: boolean;
  canApprove: boolean;
  today: string;
  onClose: () => void;
};

type Action = (state: AdminActionState, fd: FormData) => Promise<AdminActionState>;

/** Small form wrapper that reports success to the parent (to reload extras). */
function ActionForm({ action, children, className, onDone, confirm }: { action: Action; children: React.ReactNode; className?: string; onDone?: () => void; confirm?: string }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(action, null);
  useEffect(() => {
    if (state?.ok) onDone?.();
  }, [state, onDone]);
  return (
    <form
      className={className}
      aria-busy={pending || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        if (confirm && !window.confirm(confirm)) return;
        const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => formAction(fd));
      }}
    >
      {children}
      <AdminActionMessage state={state} pending={pending} />
    </form>
  );
}

/** Action-style message; outside render so the timestamp is not computed while rendering. */
function note(ok: boolean, message: string): AdminActionState {
  return { ok, message, at: Date.now() };
}

const fmtQty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ""));

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function OrderDrawer({ order, projectId, projects = [], canEdit, canApprove, today, onClose }: Props) {
  const [extras, setExtras] = useState<{ receipts: OrderReceipt[]; documents: OrderDocument[] } | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!order) return;
    let live = true;
    orderExtrasAction(order.id).then((x) => live && setExtras(x));
    return () => {
      live = false;
    };
  }, [order, tick]);

  const title = order ? `${order.supplier_name}: ${order.description}` : "New supplier order";
  const readOnly = !canEdit;

  return (
    <AdminDrawer open title={title} onClose={onClose}>
      <div className="proc-drawer">
        {order ? (
          <p className="proc-drawer__project">
            <Link href={`/admin/operations/projects/${order.project_id}/?tab=materials`}>{order.project.title}</Link>
            {order.project.customer_name ? ` · ${order.project.customer_name}` : ""}
          </p>
        ) : null}

        <section aria-labelledby="proc-details">
          <h3 id="proc-details">Order</h3>
          <OrderForm order={order} projectId={projectId} projects={projects} readOnly={readOnly} canApprove={canApprove} onSaved={order ? reload : onClose} />
        </section>

        {order ? (
          <>
            <LinesSection order={order} readOnly={readOnly} onChanged={reload} />
            <ReceiptsSection order={order} receipts={extras?.receipts ?? null} readOnly={readOnly} today={today} onChanged={reload} />
            <DocumentsSection order={order} documents={extras?.documents ?? null} readOnly={readOnly} onChanged={reload} />
            <BillsSection order={order} canApprove={canApprove} onChanged={reload} />
          </>
        ) : (
          <p className="ops-cal-empty">Save the order first, then add its lines, deliveries, documents and Xero bills.</p>
        )}
      </div>
    </AdminDrawer>
  );
}

function OrderForm({ order, projectId, projects, readOnly, canApprove, onSaved }: { order: ProcurementOrder | null; projectId?: string; projects: ProjectChoice[]; readOnly: boolean; canApprove: boolean; onSaved: () => void }) {
  const statuses = ORDER_STATUS_CHOICES.filter((s) => s !== "approved" || canApprove || order?.status === "approved");
  return (
    <ActionForm action={saveOrderAction} className="proc-form" onDone={onSaved}>
      <fieldset disabled={readOnly} className="proc-fieldset">
        {order ? (
          <>
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="expected_version" value={order.version ?? 1} />
          </>
        ) : projectId ? (
          <input type="hidden" name="project_id" value={projectId} />
        ) : (
          <label className="proc-field proc-field--wide">
            <span>Project</span>
            <select name="project_id" required defaultValue="">
              <option value="">Choose a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </label>
        )}
        <label className="proc-field">
          <span>Supplier</span>
          <input name="supplier_name" required maxLength={200} defaultValue={order?.supplier_name ?? ""} autoComplete="off" />
        </label>
        <label className="proc-field">
          <span>Status</span>
          <select name="status" defaultValue={order?.status && order.status !== "paid" ? order.status : "not_ordered"}>
            {statuses.map((s) => (
              <option key={s} value={s}>{MATERIAL_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <label className="proc-field proc-field--wide">
          <span>What is being ordered</span>
          <input name="description" required maxLength={500} defaultValue={order?.description ?? ""} />
        </label>
        <label className="proc-field">
          <span>Our order ref</span>
          <input name="order_reference" maxLength={80} defaultValue={order?.order_reference ?? ""} />
        </label>
        <label className="proc-field">
          <span>Supplier ref / quote no.</span>
          <input name="supplier_reference" maxLength={80} defaultValue={order?.supplier_reference ?? ""} />
        </label>
        <label className="proc-field">
          <span>Delivery or collection</span>
          <select name="fulfilment" defaultValue={order?.fulfilment ?? "tbc"}>
            {MATERIAL_FULFILMENT.map((f) => (
              <option key={f} value={f}>{FULFILMENT_LABELS[f]}</option>
            ))}
          </select>
        </label>
        <label className="proc-field">
          <span>Lead time (days)</span>
          <input name="lead_time_days" inputMode="numeric" defaultValue={order?.lead_time_days ?? ""} />
        </label>
        <label className="proc-field">
          <span>Ordered on</span>
          <input type="date" name="order_date" defaultValue={order?.order_date ?? ""} />
        </label>
        <label className="proc-field">
          <span>Expected</span>
          <input type="date" name="expected_date" defaultValue={order?.expected_date ?? ""} />
        </label>
        <label className="proc-field">
          <span>Needed on site by</span>
          <input type="date" name="required_on_site" defaultValue={order?.required_on_site ?? ""} />
        </label>
        <label className="proc-field">
          <span>Quote valid until</span>
          <input type="date" name="quote_valid_until" defaultValue={order?.quote_valid_until ?? ""} />
        </label>
        <label className="proc-field proc-field--wide">
          <span>Delivery instructions</span>
          <input name="delivery_instructions" maxLength={1000} defaultValue={order?.delivery_instructions ?? ""} />
        </label>
        <label className="proc-field proc-field--wide">
          <span>Notes</span>
          <textarea name="notes" rows={2} maxLength={2000} defaultValue={order?.notes ?? ""} />
        </label>
      </fieldset>
      {order?.status === "paid" ? <p className="proc-note">This order used the old “Paid” status. Payment now comes from linked Xero bills; pick its delivery status.</p> : null}
      {!canApprove ? <p className="proc-note">An owner or admin approves orders.</p> : null}
      {!readOnly ? (
        <div className="proc-actions">
          <AdminButton type="submit" variant="primary" size="sm">{order ? "Save order" : "Add order"}</AdminButton>
        </div>
      ) : null}
    </ActionForm>
  );
}

function LinesSection({ order, readOnly, onChanged }: { order: ProcurementOrder; readOnly: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <section aria-labelledby="proc-lines">
      <h3 id="proc-lines">
        Items <span className="proc-muted">{formatOpsMoney(order.totals.exclVat)} excl. VAT · {formatOpsMoney(order.totals.inclVat)} incl.</span>
      </h3>
      {order.lines.length ? (
        <table className="proc-table">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Qty</th>
              <th scope="col">Received</th>
              <th scope="col">Excl. VAT</th>
              {!readOnly ? <th scope="col"><span className="sr-only">Actions</span></th> : null}
            </tr>
          </thead>
          <tbody>
            {order.lines.map((l) =>
              editing === l.id ? (
                <tr key={l.id}>
                  <td colSpan={5}>
                    <LineForm orderId={order.id} line={l} onDone={() => { setEditing(null); onChanged(); }} />
                  </td>
                </tr>
              ) : (
                <tr key={l.id}>
                  <td>
                    {l.description}
                    {l.specification ? <span className="proc-muted"> · {l.specification}</span> : null}
                  </td>
                  <td>{fmtQty(l.quantity)} {l.unit}</td>
                  <td>
                    {fmtQty(l.quantity_received)}
                    {lineOutstanding(l) > 0 ? <span className="proc-muted"> ({fmtQty(lineOutstanding(l))} to come)</span> : <span className="proc-ok"> ✓</span>}
                    {l.quantity_rejected ? <span className="proc-warn"> · {fmtQty(l.quantity_rejected)} rejected</span> : null}
                  </td>
                  <td>{l.unit_cost_excl_vat === null ? <span className="proc-muted">No price</span> : formatOpsMoney(lineTotalExclVat(l))}</td>
                  {!readOnly ? (
                    <td className="proc-row-actions">
                      <button type="button" className="proc-link" onClick={() => setEditing(l.id)}>Edit</button>
                      <ActionForm action={deleteLineAction} onDone={onChanged} confirm="Remove this item?">
                        <input type="hidden" name="line_id" value={l.id} />
                        <button type="submit" className="proc-link proc-link--danger">Remove</button>
                      </ActionForm>
                    </td>
                  ) : null}
                </tr>
              ),
            )}
          </tbody>
        </table>
      ) : (
        <p className="ops-cal-empty">No items yet. Add what is on the supplier&rsquo;s quote.</p>
      )}
      {!readOnly ? (
        <details className="proc-add">
          <summary>Add an item</summary>
          <LineForm orderId={order.id} onDone={onChanged} />
        </details>
      ) : null}
    </section>
  );
}

function LineForm({ orderId, line, onDone }: { orderId: string; line?: ProcurementOrder["lines"][number]; onDone: () => void }) {
  return (
    <ActionForm action={saveLineAction} className="proc-form proc-form--line" onDone={onDone}>
      <input type="hidden" name="order_id" value={orderId} />
      {line ? <input type="hidden" name="line_id" value={line.id} /> : null}
      <label className="proc-field proc-field--wide">
        <span>Item</span>
        <input name="description" required maxLength={300} defaultValue={line?.description ?? ""} placeholder="e.g. HDPE geomembrane 1.0 mm" />
      </label>
      <label className="proc-field proc-field--wide">
        <span>Specification</span>
        <input name="specification" maxLength={500} defaultValue={line?.specification ?? ""} placeholder="e.g. 7 m roll, black, textured" />
      </label>
      <label className="proc-field">
        <span>Quantity</span>
        <input name="quantity" required inputMode="decimal" defaultValue={line ? fmtQty(line.quantity) : ""} />
      </label>
      <label className="proc-field">
        <span>Unit</span>
        <input name="unit" maxLength={20} defaultValue={line?.unit ?? "each"} />
      </label>
      <label className="proc-field">
        <span>Unit price excl. VAT (R)</span>
        <input name="unit_cost_excl_vat" inputMode="decimal" defaultValue={line?.unit_cost_excl_vat ?? ""} />
      </label>
      <label className="proc-field">
        <span>Discount %</span>
        <input name="discount_pct" inputMode="decimal" defaultValue={line?.discount_pct ?? 0} />
      </label>
      <label className="proc-field">
        <span>VAT %</span>
        <input name="vat_rate" inputMode="decimal" defaultValue={line?.vat_rate ?? 15} />
      </label>
      <div className="proc-actions">
        <AdminButton type="submit" variant="secondary" size="sm">{line ? "Save item" : "Add item"}</AdminButton>
      </div>
    </ActionForm>
  );
}

function ReceiptsSection({ order, receipts, readOnly, today, onChanged }: { order: ProcurementOrder; receipts: OrderReceipt[] | null; readOnly: boolean; today: string; onChanged: () => void }) {
  const lineName = new Map(order.lines.map((l) => [l.id, l.description]));
  const open = order.lines.filter((l) => lineOutstanding(l) > 0);
  return (
    <section aria-labelledby="proc-receipts">
      <h3 id="proc-receipts">
        Deliveries <span className="proc-muted">{order.progress.state === "no_lines" ? "" : `${order.progress.received} of ${order.progress.ordered} items in full`}</span>
      </h3>
      {!readOnly && open.length ? (
        <details className="proc-add">
          <summary>Record a delivery or collection</summary>
          <ActionForm action={recordReceiptAction} className="proc-form" onDone={onChanged}>
            <input type="hidden" name="order_id" value={order.id} />
            <label className="proc-field">
              <span>Date</span>
              <input type="date" name="received_on" required defaultValue={today} />
            </label>
            <label className="proc-field">
              <span>Delivery note no.</span>
              <input name="delivery_note_ref" maxLength={80} />
            </label>
            <table className="proc-table proc-field--wide">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Still to come</th>
                  <th scope="col">Accepted</th>
                  <th scope="col">Rejected</th>
                </tr>
              </thead>
              <tbody>
                {open.map((l) => (
                  <tr key={l.id}>
                    <td>{l.description}</td>
                    <td>{fmtQty(lineOutstanding(l))} {l.unit}</td>
                    <td><input name={`accepted_${l.id}`} inputMode="decimal" aria-label={`Accepted ${l.description}`} className="proc-qty" /></td>
                    <td><input name={`rejected_${l.id}`} inputMode="decimal" aria-label={`Rejected ${l.description}`} className="proc-qty" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <label className="proc-field proc-field--wide">
              <span>Notes (damage, short delivery…)</span>
              <input name="notes" maxLength={500} />
            </label>
            <div className="proc-actions">
              <AdminButton type="submit" variant="secondary" size="sm">Record delivery</AdminButton>
            </div>
          </ActionForm>
        </details>
      ) : null}
      {receipts === null ? (
        <p className="ops-cal-empty">Loading…</p>
      ) : receipts.length ? (
        <ul className="proc-list">
          {receipts.map((r) => (
            <li key={r.id} className={r.reversed_at ? "is-reversed" : undefined}>
              <span>
                {formatOpsDate(r.received_on)} · {lineName.get(r.line_id) ?? "Item"}: {fmtQty(r.quantity_accepted)} accepted
                {r.quantity_rejected ? `, ${fmtQty(r.quantity_rejected)} rejected` : ""}
                {r.delivery_note_ref ? ` · DN ${r.delivery_note_ref}` : ""}
                {r.received_by_label ? ` · ${r.received_by_label}` : ""}
                {r.reversed_at ? ` · reversed: ${r.reversal_reason}` : ""}
              </span>
              {!readOnly && !r.reversed_at ? (
                <ActionForm
                  action={async (prev, fd) => {
                    const reason = window.prompt("Why is this delivery being reversed?");
                    if (!reason) return prev;
                    fd.set("reason", reason);
                    return reverseReceiptAction(prev, fd);
                  }}
                  onDone={onChanged}
                >
                  <input type="hidden" name="receipt_id" value={r.id} />
                  <button type="submit" className="proc-link">Reverse</button>
                </ActionForm>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ops-cal-empty">Nothing received yet.</p>
      )}
    </section>
  );
}

function DocumentsSection({ order, documents, readOnly, onChanged }: { order: ProcurementOrder; documents: OrderDocument[] | null; readOnly: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<AdminActionState>(null);

  const upload = async (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const file = fd.get("file");
    const docType = String(fd.get("doc_type") ?? "");
    if (!(file instanceof File) || !file.size) {
      setMessage(note(false, "Choose a file to upload."));
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const sha256 = await sha256Hex(file);
      const prep = await prepareUploadAction({ orderId: order.id, docType, fileName: file.name, contentType: file.type, size: file.size, sha256 });
      if ("error" in prep) throw new Error(prep.error);
      const put = await fetch(prep.uploadUrl, { method: "PUT", body: file, headers: { "content-type": file.type } });
      if (!put.ok) throw new Error("The upload did not finish. Check your connection and try again.");
      const done = await finishUploadAction({ orderId: order.id, docType, fileName: file.name, path: prep.path });
      if ("error" in done) throw new Error(done.error);
      form.reset();
      setMessage(note(true, "Document uploaded."));
      onChanged();
    } catch (error) {
      setMessage(note(false, error instanceof Error ? error.message : "The upload failed."));
    } finally {
      setBusy(false);
    }
  };

  const open = async (id: string) => {
    const r = await documentLinkAction(id);
    if ("url" in r) window.open(r.url, "_blank", "noopener");
    else setMessage(note(false, r.error));
  };

  return (
    <section aria-labelledby="proc-docs">
      <h3 id="proc-docs">Documents</h3>
      {documents === null ? (
        <p className="ops-cal-empty">Loading…</p>
      ) : documents.length ? (
        <ul className="proc-list">
          {documents.map((d) => (
            <li key={d.id}>
              <button type="button" className="proc-link" onClick={() => open(d.id)}>{d.file_name}</button>
              <span className="proc-muted">
                {DOCUMENT_TYPE_LABELS[d.doc_type]} · {(d.size_bytes / 1024 / 1024).toFixed(1)} MB · {formatOpsDate(d.created_at.slice(0, 10))}
                {d.uploaded_by_label ? ` · ${d.uploaded_by_label}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ops-cal-empty">No documents yet.</p>
      )}
      {!readOnly ? (
        <form
          className="proc-form proc-upload"
          aria-busy={busy || undefined}
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void upload(e.currentTarget);
          }}
        >
          <label className="proc-field">
            <span>Type</span>
            <select name="doc_type" defaultValue="supplier_quote">
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <label className="proc-field">
            <span>File (PDF, photo, Excel, Word; max 20 MB)</span>
            <input type="file" name="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.xlsx,.docx" />
          </label>
          <div className="proc-actions">
            <AdminButton type="submit" variant="secondary" size="sm" disabled={busy}>{busy ? "Uploading…" : "Upload"}</AdminButton>
          </div>
        </form>
      ) : null}
      <AdminActionMessage state={message} pending={busy} />
    </section>
  );
}

function BillsSection({ order, canApprove, onChanged }: { order: ProcurementOrder; canApprove: boolean; onChanged: () => void }) {
  const [options, setOptions] = useState<BillOption[] | null>(null);
  const [search, setSearch] = useState(order.supplier_name);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const linked = new Set(order.bills.map((b) => b.xero_invoice_id));
  const lastSync = order.bills.map((b) => b.last_synced_at).filter(Boolean).sort().at(0);

  const find = async () => {
    setLoading(true);
    setError(null);
    const r = await searchBillsAction(order.id, search);
    setLoading(false);
    if ("error" in r) setError(r.error);
    else setOptions(r.bills);
  };

  return (
    <section aria-labelledby="proc-bills">
      <h3 id="proc-bills">Xero supplier bills</h3>
      <p className="proc-note">Amounts and payment come from Xero. Receiving materials never marks a bill paid.</p>
      {order.bills.length ? (
        <>
          <table className="proc-table">
            <thead>
              <tr>
                <th scope="col">Bill</th>
                <th scope="col">Status</th>
                <th scope="col">Total</th>
                <th scope="col">Paid</th>
                <th scope="col">Due</th>
                {canApprove ? <th scope="col"><span className="sr-only">Actions</span></th> : null}
              </tr>
            </thead>
            <tbody>
              {order.bills.map((b) => (
                <tr key={b.id}>
                  <td>{b.bill_number ?? "No number"}<span className="proc-muted"> · {formatOpsDate(b.bill_date)}</span></td>
                  <td>{b.xero_status ?? "?"}</td>
                  <td>{formatOpsMoney(b.total_incl_vat)}</td>
                  <td>{formatOpsMoney(b.amount_paid)}</td>
                  <td>{formatOpsMoney(b.amount_due)}{b.due_date ? <span className="proc-muted"> by {formatOpsDate(b.due_date)}</span> : null}</td>
                  {canApprove ? (
                    <td>
                      <ActionForm action={unlinkBillAction} onDone={onChanged} confirm="Unlink this bill from the order? Nothing changes in Xero.">
                        <input type="hidden" name="link_id" value={b.id} />
                        <button type="submit" className="proc-link">Unlink</button>
                      </ActionForm>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          <ActionForm action={refreshBillsAction} className="proc-inline" onDone={onChanged}>
            <input type="hidden" name="order_id" value={order.id} />
            <span className="proc-muted">Last refreshed {lastSync ? formatOpsDateTime(lastSync) : "never"}.</span>
            <AdminButton type="submit" variant="ghost" size="sm">Refresh from Xero</AdminButton>
          </ActionForm>
        </>
      ) : (
        <p className="ops-cal-empty">No Xero bill linked.</p>
      )}
      {canApprove ? (
        <div className="proc-bill-search">
          <label className="proc-field">
            <span>Xero supplier name (exact)</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <AdminButton type="button" variant="secondary" size="sm" onClick={find} disabled={loading}>{loading ? "Looking in Xero…" : "Find bills"}</AdminButton>
          {error ? <p className="proc-warn" role="alert">{error}</p> : null}
          {options ? (
            options.length ? (
              <ul className="proc-list">
                {options.map((b) => (
                  <li key={b.id}>
                    <span>
                      <strong>{b.number ?? "No number"}</strong> · {b.contact} · {formatOpsDate(b.date)} · {formatOpsMoney(b.total)} · {b.status}
                      {b.reference ? <span className="proc-muted"> · ref {b.reference}</span> : null}
                    </span>
                    {linked.has(b.id) ? (
                      <span className="proc-ok">Linked</span>
                    ) : (
                      <ActionForm action={linkBillAction} onDone={() => { onChanged(); setOptions(null); }}>
                        <input type="hidden" name="order_id" value={order.id} />
                        <input type="hidden" name="xero_invoice_id" value={b.id} />
                        <button type="submit" className="proc-link">Link</button>
                      </ActionForm>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ops-cal-empty">No bills from that supplier in the last 12 months. Check the name matches Xero exactly.</p>
            )
          ) : null}
        </div>
      ) : (
        <p className="proc-note">An owner or admin links Xero bills.</p>
      )}
    </section>
  );
}
