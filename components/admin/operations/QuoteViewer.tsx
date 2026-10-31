"use client";

import { useEffect, useState } from "react";
import { AdminButton } from "@/components/admin/ui";
import { quoteDetailAction, type ProjectQuoteRef, type QuoteDetail } from "@/app/admin/operations/quote-view-actions";
import { formatOpsDateTime, formatOpsMoney } from "./ops-format";

const SHORT = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmtDate = (d: string | null | undefined) => (d && /^\d{4}-\d{2}-\d{2}/.test(d) ? SHORT.format(new Date(`${d.slice(0, 10)}T00:00:00Z`)) : "—");
const fmtQty = (n: number | null) => (n === null ? "—" : Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ""));

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="ops-peek-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** One Xero quote, read live. Totals are Xero's; nothing is recalculated here. */
export function QuoteView({ projectId, quoteRef, onBack, backLabel = "← Back to project" }: { projectId: string; quoteRef: ProjectQuoteRef; onBack: () => void; backLabel?: string }) {
  const [state, setState] = useState<{ quote?: QuoteDetail; error?: string } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    quoteDetailAction(projectId, { quoteId: quoteRef.quoteId, number: quoteRef.number }).then((r) => {
      if (live) setState("error" in r ? { error: r.error } : { quote: r.quote });
    });
    return () => {
      live = false;
    };
  }, [projectId, quoteRef, tick]);

  const q = state?.quote;
  const money = (n: number | null) => (n === null ? "—" : formatOpsMoney(n));
  return (
    <div className="ops-peek ops-quote">
      <div className="ops-peek__actions">
        <AdminButton size="sm" variant="ghost" onClick={onBack}>{backLabel}</AdminButton>
        <AdminButton size="sm" variant="ghost" onClick={() => { setState(null); setTick((t) => t + 1); }}>Reload from Xero</AdminButton>
      </div>
      {!state ? <p className="ops-peek-muted">Reading quote {quoteRef.number} from Xero…</p> : null}
      {state?.error ? <p className="ops-peek-warn" role="alert">{state.error}</p> : null}
      {q ? (
        <>
          <header className="ops-quote__head">
            <h3>Quote {q.number}</h3>
            <span className="ops-peek-chip">{q.status}</span>
          </header>
          {q.title ? <p className="ops-quote__title">{q.title}</p> : null}
          <dl className="ops-peek-list">
            <Row label="Customer">{q.contact ?? "—"}</Row>
            <Row label="Date">{fmtDate(q.date)}</Row>
            <Row label="Expires">{fmtDate(q.expiry_date)}</Row>
            {q.reference ? <Row label="Reference">{q.reference}</Row> : null}
          </dl>
          {q.contactMismatch ? <p className="ops-peek-warn">This quote&rsquo;s Xero customer is not the project&rsquo;s Xero contact. Check it is the right quote.</p> : null}
          {q.summary ? <p className="ops-peek-notes">{q.summary}</p> : null}
          <div className="ops-quote__lines">
            <table>
              <thead>
                <tr>
                  <th scope="col">Description</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Unit</th>
                  <th scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                {q.lines.map((l, i) => (
                  <tr key={i}>
                    <td>
                      <span className="ops-quote__desc">{l.description ?? "—"}</span>
                      {l.item_code ? <span className="ops-peek-muted"> {l.item_code}</span> : null}
                    </td>
                    <td>{fmtQty(l.quantity)}</td>
                    <td>{money(l.unit_amount)}</td>
                    <td>{money(l.line_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="ops-quote__totals">
            <div><dt>Subtotal</dt><dd>{money(q.subtotal)}</dd></div>
            <div><dt>VAT</dt><dd>{money(q.tax)}</dd></div>
            <div className="is-total"><dt>Total{q.currency ? ` (${q.currency})` : ""}</dt><dd>{money(q.total)}</dd></div>
          </dl>
          {q.terms ? (
            <details className="ops-quote__terms">
              <summary>Terms</summary>
              <p className="ops-peek-notes">{q.terms}</p>
            </details>
          ) : null}
          <p className="ops-peek-muted">
            Read live from Xero at {formatOpsDateTime(q.fetchedAt)}{q.matchedBy === "quote_number" ? ", found by quote number" : ""}. Line amounts are as Xero shows them. The PDF button will come once the Xero bridge can send quote PDFs.
          </p>
        </>
      ) : null}
    </div>
  );
}
