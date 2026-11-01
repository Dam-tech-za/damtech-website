"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateBoardFieldAction } from "@/app/admin/operations/board-field-actions";
import type { ProjectQuoteRef } from "@/app/admin/operations/quote-view-actions";
import { formatOpsMoney } from "@/components/admin/operations/ops-format";
import { QuoteView } from "@/components/admin/operations/QuoteViewer";
import { attachInvoiceAction, findClientInvoicesAction, findClientQuotesAction, linkQuoteAction, setInvoiceKindAction, type InvoiceCandidate, type QuoteCandidate } from "@/app/admin/operations/invoice-link-actions";

/** Project lead picked from the Person list (the board's master list). */
export function LeadSelect({ projectId, current, options }: { projectId: string; current: string | null; options: string[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const value = current ?? "";
  const offList = Boolean(value) && !options.some((o) => o.toLowerCase() === value.toLowerCase());
  return (
    <span className="pj-lead">
      <select
        className="admin-select"
        value={value}
        disabled={saving}
        aria-label="Project lead"
        onChange={async (e) => {
          setSaving(true);
          setError(null);
          const r = await updateBoardFieldAction({ id: projectId, field: "lead", value: e.target.value });
          setSaving(false);
          if (!r?.ok) setError(r?.message || "Could not save.");
          else router.refresh();
        }}
      >
        <option value="">No lead</option>
        {offList ? <option value={value}>{value} (not on list)</option> : null}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {error ? <span className="pj-error" role="alert">{error}</span> : null}
    </span>
  );
}

/** The project's Xero quotes with a live, read-only viewer. */
export function ProjectQuotes({ projectId, quotes }: { projectId: string; quotes: ProjectQuoteRef[] }) {
  const [open, setOpen] = useState<ProjectQuoteRef | null>(null);
  if (open) {
    return <QuoteView projectId={projectId} quoteRef={open} onBack={() => setOpen(null)} backLabel="← All quotes" />;
  }
  if (!quotes.length) {
    return (
      <>
        <p className="pj-muted">No Xero quote linked yet.</p>
        <QuoteFinder projectId={projectId} />
      </>
    );
  }
  return (
    <>
    <ul className="pj-list">
      {quotes.map((q) => (
        <li key={q.quoteId ?? q.number}>
          <span>
            <strong>{q.number}</strong>
            <span className="pj-muted">
              {[q.status?.toLowerCase(), q.total !== null ? formatOpsMoney(q.total) : null, q.quoteId ? null : "number only"].filter(Boolean).join(" · ")}
            </span>
          </span>
          <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => setOpen(q)}>
            View quote
          </button>
        </li>
      ))}
    </ul>
    <QuoteFinder projectId={projectId} />
    </>
  );
}

/** Invoice type chosen by a person; "Automatic" lets the rules decide. */
export function InvoiceKindSelect({ linkId, stored, shown }: { linkId: string; stored: string; shown: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <select
      className="pj-kind"
      value={stored}
      disabled={busy}
      aria-label="Invoice type"
      title={stored === "unclassified" ? `Automatic: ${shown}` : "Set by hand"}
      onChange={async (e) => {
        setBusy(true);
        const fd = new FormData();
        fd.set("link_id", linkId);
        fd.set("kind", e.target.value);
        const r = await setInvoiceKindAction(null, fd);
        setBusy(false);
        if (!r?.ok) window.alert(r?.message || "Could not save.");
        else router.refresh();
      }}
    >
      <option value="unclassified">Auto ({shown})</option>
      <option value="deposit">Deposit</option>
      <option value="progress">Progress</option>
      <option value="final">Balance</option>
      <option value="full">Full</option>
      <option value="variation">Variation</option>
    </select>
  );
}

/** Invoices for the same Xero client that are not on any project yet; the user ticks which belong here. */
export function InvoiceCandidates({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [state, setState] = useState<{ list?: InvoiceCandidate[]; anchor?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const find = async () => {
    setLoading(true);
    const r = await findClientInvoicesAction(projectId);
    setLoading(false);
    setState("error" in r ? { error: r.error } : { list: r.candidates, anchor: r.anchor });
  };
  const attach = async (id: string) => {
    setBusy(id);
    const fd = new FormData();
    fd.set("project_id", projectId);
    fd.set("xero_invoice_id", id);
    const r = await attachInvoiceAction(null, fd);
    setBusy(null);
    if (!r?.ok) return window.alert(r?.message || "Could not attach.");
    setState((s) => (s?.list ? { ...s, list: s.list.filter((c) => c.id !== id) } : s));
    router.refresh();
  };

  return (
    <div className="pj-cands">
      <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={find} disabled={loading}>
        {loading ? "Looking in Xero…" : "Link invoice"}
      </button>
      {state?.error ? <p className="pj-error" role="alert">{state.error}</p> : null}
      {state?.list ? (
        state.list.length ? (
          <ul className="pj-list">
            {state.list.map((c) => (
              <li key={c.id}>
                <span>
                  <strong>{c.number ?? "No number"}</strong>
                  <span className="pj-muted">
                    {[c.date, formatOpsMoney(c.total), c.status.toLowerCase(), c.amount_due > 0 ? `${formatOpsMoney(c.amount_due)} due` : null].filter(Boolean).join(" · ")}
                  </span>
                  {c.reference ? <span className="pj-muted">Ref: {c.reference}{c.referenceMatch ? " ✓ matches the quote" : ""}</span> : null}
                </span>
                <button type="button" className="admin-btn admin-btn--outline admin-btn--sm" disabled={busy === c.id} onClick={() => void attach(c.id)}>
                  {busy === c.id ? "Attaching…" : "Attach"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pj-muted">No unattached invoices for the {state.anchor}.</p>
        )
      ) : null}
    </div>
  );
}

/** For projects created from an invoice: find the client's quote in Xero and link it, so View quote works. */
export function QuoteFinder({ projectId, onLinked }: { projectId: string; onLinked?: () => void }) {
  const router = useRouter();
  const [state, setState] = useState<{ list?: QuoteCandidate[]; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const find = async () => {
    setLoading(true);
    setMessage(null);
    const r = await findClientQuotesAction(projectId);
    setLoading(false);
    setState("error" in r ? { error: r.error } : { list: r.quotes });
  };
  const link = async (id: string) => {
    setBusy(id);
    const fd = new FormData();
    fd.set("project_id", projectId);
    fd.set("xero_quote_id", id);
    const r = await linkQuoteAction(null, fd);
    setBusy(null);
    if (!r?.ok) return setMessage(r?.message || "Could not link.");
    setMessage(r.message);
    setState(null);
    onLinked?.();
    router.refresh();
  };

  return (
    <div className="pj-cands">
      <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={find} disabled={loading}>
        {loading ? "Looking in Xero…" : "Link quote"}
      </button>
      {message ? <p className="pj-muted" role="status">{message}</p> : null}
      {state?.error ? <p className="pj-error" role="alert">{state.error}</p> : null}
      {state?.list ? (
        state.list.length ? (
          <ul className="pj-list">
            {state.list.map((q) => (
              <li key={q.id}>
                <span>
                  <strong>{q.number}</strong>
                  <span className="pj-muted">{[q.status.toLowerCase(), q.date, q.total !== null ? formatOpsMoney(q.total) : null].filter(Boolean).join(" · ")}</span>
                  {q.title ? <span className="pj-muted">{q.title}</span> : null}
                  {q.namedOnInvoice ? <span className="pj-muted">✓ named on this project&rsquo;s invoice</span> : null}
                </span>
                {q.linked ? (
                  <span className="pj-muted">Linked</span>
                ) : (
                  <button type="button" className="admin-btn admin-btn--outline admin-btn--sm" disabled={busy === q.id} onClick={() => void link(q.id)}>
                    {busy === q.id ? "Linking…" : "Link"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="pj-muted">No quotes found in Xero for this client.</p>
        )
      ) : null}
    </div>
  );
}
