"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { AdminButton } from "@/components/admin/ui";
import {
  applyXeroTotalAction,
  refreshProjectFromXeroAction,
  updateBoardFieldAction,
} from "@/app/admin/operations/board-field-actions";
import { projectQuotesAction, type ProjectQuoteRef } from "@/app/admin/operations/quote-view-actions";
import { MATERIALS_ROLLUP_LABELS, PAYMENT_LABEL_TEXT } from "@/lib/operations/board";
import { SERVICE_LABELS, STAGE_LABELS } from "@/lib/operations/lifecycle";
import { PROJECT_STAGES } from "@/lib/operations/types";
import { stripBoardMetaFromScope } from "@/lib/operations/board-meta";
import { formatLocationCell } from "@/lib/operations/distance";
import type { BoardProject } from "@/lib/operations/queries";
import { displayPhone, splitPhone } from "@/lib/operations/phone-display";
import { CountryFlag } from "./CountryFlag";
import {
  LeadCell,
  LocationEditCell,
  PaymentEditCell,
  ValueEditCell,
  XeroEditCell,
} from "./BoardEditableCells";
import { formatOpsDateTime, formatOpsMoney } from "./ops-format";
import { QuoteView } from "./QuoteViewer";
import { InvoiceCandidates, QuoteFinder } from "./project/ProjectClientParts";

function PeekForm({
  project,
  onPatched,
  leadSuggestions,
  onLinkXero,
}: {
  project: BoardProject;
  onPatched?: (p: BoardProject) => void;
  leadSuggestions: string[];
  onLinkXero?: () => void;
}) {
  const [title, setTitle] = useState(project.title);
  const [company, setCompany] = useState(project.customer_name ?? "");
  const [email, setEmail] = useState(project.contact_email ?? "");
  const [client, setClient] = useState(project.contact_person ?? "");
  const initialPhone = splitPhone(project.contact_phone);
  const [phoneCode, setPhoneCode] = useState(initialPhone.code);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.national);
  const [notes, setNotes] = useState(stripBoardMetaFromScope(project.scope));
  const [nextAction, setNextAction] = useState(project.next_action ?? "");
  const [nextDue, setNextDue] = useState(project.next_action_due ?? "");
  const [stage, setStage] = useState(project.stage);
  const [busy, setBusy] = useState<string | null>(null);

  const save = async (field: string, value: string) => {
    setBusy(field);
    const result = await updateBoardFieldAction({ id: project.id, field, value });
    setBusy(null);
    if (!result?.ok) {
      window.alert(result?.message || "Could not save.");
      return;
    }
    onPatched?.({ ...project });
  };

  return (
    <div className="ops-peek-form">
      <label className="ops-peek-form__field">
        <span>Project name</span>
        <input
          className="admin-input"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => void save("title", title)}
        />
      </label>
      <label className="ops-peek-form__field">
        <span>Lead</span>
        <LeadCell project={project} canEdit suggestions={leadSuggestions} onPatched={onPatched} />
      </label>
      <label className="ops-peek-form__field">
        <span>Payment</span>
        <PaymentEditCell project={project} canEdit onPatched={onPatched} />
      </label>
      <label className="ops-peek-form__field">
        <span>Company</span>
        <input
          className="admin-input"
          value={company}
          maxLength={200}
          onChange={(e) => setCompany(e.target.value)}
          onBlur={() => void save("company", company)}
        />
      </label>
      <label className="ops-peek-form__field">
        <span>Client</span>
        <input
          className="admin-input"
          value={client}
          maxLength={200}
          onChange={(e) => setClient(e.target.value)}
          onBlur={() => void save("client", client)}
        />
      </label>
      <div className="ops-peek-form__field">
        <span id={`peek-phone-${project.id}`}>Client phone</span>
        <span className="ops-peek-phone" role="group" aria-labelledby={`peek-phone-${project.id}`}>
          <span className="ops-peek-phone__flag">
            <CountryFlag country={displayPhone(`${phoneCode}${phoneNumber}`)?.country ?? null} />
          </span>
          <input
            className="admin-input ops-peek-phone__code"
            value={phoneCode}
            maxLength={5}
            inputMode="tel"
            aria-label="Country code"
            onChange={(e) => setPhoneCode(e.target.value.replace(/[^\d+]/g, "").replace(/^(?!\+)/, "+"))}
            onBlur={() => phoneNumber.trim() && void save("phone", `${phoneCode}${phoneNumber}`)}
          />
          <input
            className="admin-input"
            value={phoneNumber}
            maxLength={20}
            inputMode="tel"
            placeholder="74 123 4567"
            aria-label="Phone number"
            onChange={(e) => setPhoneNumber(e.target.value)}
            onBlur={() => void save("phone", phoneNumber.trim() ? `${phoneCode}${phoneNumber.replace(/^0/, "")}` : "")}
          />
        </span>
      </div>
      <label className="ops-peek-form__field">
        <span>Client email</span>
        <input
          className="admin-input"
          type="email"
          value={email}
          maxLength={200}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => void save("email", email)}
        />
      </label>
      <div className="ops-peek-form__field">
        <span>Xero</span>
        <XeroEditCell project={project} canEdit onPatched={onPatched} />
        {onLinkXero ? (
          <button type="button" className="ops-sheet__text-btn" onClick={onLinkXero}>
            Link to Xero
          </button>
        ) : null}
      </div>
      <div className="ops-peek-form__field">
        <span>Value {formatOpsMoney(project.quoted_total_incl_vat)}</span>
        <ValueEditCell project={project} canEdit onPatched={onPatched} />
        <button
          type="button"
          className="ops-sheet__text-btn"
          disabled={busy === "xero-total"}
          onClick={() => {
            void (async () => {
              setBusy("xero-total");
              const result = await applyXeroTotalAction({ id: project.id });
              setBusy(null);
              if (!result?.ok) window.alert(result?.message || "Could not use Xero total.");
              else onPatched?.({ ...project });
            })();
          }}
        >
          Use quote total
        </button>
      </div>
      <div className="ops-peek-form__field">
        <span>Location</span>
        <LocationEditCell project={project} canEdit display={formatLocationCell(project)} onPatched={onPatched} />
      </div>
      <label className="ops-peek-form__field">
        <span>Site address / notes</span>
        <textarea
          className="admin-input"
          rows={3}
          value={notes}
          maxLength={8000}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => void save("notes", notes)}
        />
      </label>
      <label className="ops-peek-form__field">
        <span>Next step</span>
        <input
          className="admin-input"
          value={nextAction}
          maxLength={500}
          onChange={(e) => setNextAction(e.target.value)}
          onBlur={() => void save("next_action", nextAction)}
        />
      </label>
      <label className="ops-peek-form__field">
        <span>Next step by</span>
        <input
          className="admin-input"
          type="date"
          value={nextDue}
          onChange={(e) => setNextDue(e.target.value)}
          onBlur={() => void save("next_action_due", nextDue)}
        />
      </label>
      <label className="ops-peek-form__field">
        <span>Stage</span>
        <select
          className="admin-select"
          value={stage}
          onChange={(e) => {
            const next = e.target.value;
            setStage(next as BoardProject["stage"]);
            void save("stage", next);
          }}
        >
          {PROJECT_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <div className="ops-peek-form__actions">
        <AdminButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy === "refresh"}
          onClick={() => {
            void (async () => {
              setBusy("refresh");
              const result = await refreshProjectFromXeroAction({ id: project.id });
              setBusy(null);
              window.alert(result?.message || (result?.ok ? "Updated." : "Failed."));
              if (result?.ok) onPatched?.({ ...project });
            })();
          }}
        >
          Refresh from Xero
        </AdminButton>
        <Link href={`/admin/operations/projects/${project.id}/`} className="admin-btn admin-btn--secondary admin-btn--sm">
          Open full details
        </Link>
      </div>
    </div>
  );
}

type Tab = "overview" | "financials" | "operations" | "documents";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "financials", label: "Financials" },
  { id: "operations", label: "Operations" },
  { id: "documents", label: "Documents" },
];

const SHORT = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmtDate = (d: string | null | undefined) => (d && /^\d{4}-\d{2}-\d{2}/.test(d) ? SHORT.format(new Date(`${d.slice(0, 10)}T00:00:00Z`)) : "—");

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="ops-peek-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Read-only project summary with tabs; editing lives behind the Edit button. */
function ProjectOverview({
  project,
  onViewQuote,
  onEdit,
  onLinkXero,
  onPatched,
}: {
  project: BoardProject;
  onViewQuote: (q: ProjectQuoteRef) => void;
  onEdit: () => void;
  onLinkXero?: () => void;
  onPatched?: (p: BoardProject) => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [quotes, setQuotes] = useState<ProjectQuoteRef[] | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    projectQuotesAction(project.id).then((r) => {
      if (!live) return;
      if ("error" in r) setQuoteError(r.error);
      else setQuotes(r.quotes);
    });
    return () => {
      live = false;
    };
  }, [project.id, reload]);

  const pay = project.payment;
  const location = formatLocationCell(project) ?? "—";
  const phone = displayPhone(project.contact_phone);
  const notes = stripBoardMetaFromScope(project.scope);
  // If the quote list cannot load, fall back to the numbers on the project (the viewer re-checks them).
  const fallbackRefs: ProjectQuoteRef[] = (project.xero_quote_numbers ?? []).map((n) => ({ quoteId: null, number: n, status: null, total: null, date: null }));
  const primaryQuote = quotes?.[0] ?? (quoteError ? fallbackRefs[0] ?? null : null);
  const xeroTotal = quotes?.find((q) => q.total !== null)?.total ?? null;
  const localValue = project.quoted_total_incl_vat;
  const differs = xeroTotal !== null && localValue !== null && Math.abs(xeroTotal - localValue) >= 0.01;
  const quoteNumbers = quotes?.map((q) => q.number).filter(Boolean) ?? project.xero_quote_numbers ?? [];
  const linked = Boolean(quotes?.some((q) => q.quoteId)) || Boolean(project.xero_invoice_numbers?.length);

  const refresh = async () => {
    setBusy("refresh");
    const result = await refreshProjectFromXeroAction({ id: project.id });
    setBusy(null);
    window.alert(result?.message || (result?.ok ? "Updated." : "Failed."));
    if (result?.ok) onPatched?.({ ...project });
  };

  return (
    <div className="ops-peek">
      <header className="ops-peek__head">
        <p className="ops-peek__sub">
          {[SERVICE_LABELS[project.service], project.is_supply_only ? "Supply only" : null, location !== "—" ? location : null].filter(Boolean).join(" · ")}
        </p>
        <div className="ops-peek__chips">
          <span className="ops-peek-chip ops-peek-chip--stage">{STAGE_LABELS[project.stage]}</span>
          {project.on_hold ? <span className="ops-peek-chip ops-peek-chip--warn">On hold</span> : null}
          <span className="ops-peek-chip">Lead: {project.leadName ?? "none"}</span>
          {quoteNumbers.length ? <span className="ops-peek-chip">Quote {quoteNumbers.join(", ")}</span> : null}
          <span className={`ops-peek-chip${linked ? " ops-peek-chip--ok" : ""}`}>{linked ? "Xero linked" : "Not linked to Xero"}</span>
        </div>
        <div className="ops-peek__actions">
          <AdminButton size="sm" variant="secondary" onClick={onEdit}>Edit</AdminButton>
          <Link href={`/admin/operations/projects/${project.id}/`} className="admin-btn admin-btn--ghost admin-btn--sm">Open full page</Link>
        </div>
      </header>

      <section className="ops-peek-value" aria-label="Quotation value">
        <div>
          <p className="ops-peek-value__label">Quotation value</p>
          <p className="ops-peek-value__amount">{formatOpsMoney(localValue)}</p>
          <p className="ops-peek-value__note">
            {differs ? (
              <span className="ops-peek-warn">Xero quote total is {formatOpsMoney(xeroTotal)}; the project shows a different value.</span>
            ) : xeroTotal !== null ? (
              "Matches the Xero quote total (incl. VAT)."
            ) : project.quoted_total_manual ? (
              "Entered by hand."
            ) : (
              "Incl. VAT."
            )}
          </p>
          <p className="ops-peek-value__pay">
            {pay.label ? PAYMENT_LABEL_TEXT[pay.label] : "No Xero invoices yet"}
            {pay.overdue ? <span className="ops-peek-warn"> · overdue</span> : null}
          </p>
        </div>
        <div className="ops-peek-value__buttons">
          {primaryQuote ? (
            <AdminButton size="sm" variant="primary" onClick={() => onViewQuote(primaryQuote)}>View quote</AdminButton>
          ) : null}
          {quotes === null && !quoteError ? <span className="ops-peek-muted">Checking quotes…</span> : null}
          {quotes !== null && !quotes.length ? <QuoteFinder projectId={project.id} onLinked={() => setReload((n) => n + 1)} /> : null}
        </div>
      </section>

      <div className="ops-peek-tabs" role="tablist" aria-label="Project details">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" id={`peek-tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`peek-panel-${t.id}`} className={tab === t.id ? "is-active" : undefined} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`peek-panel-${tab}`} aria-labelledby={`peek-tab-${tab}`} className="ops-peek-panel">
        {tab === "overview" ? (
          <>
            <dl className="ops-peek-list">
              <Row label="Customer">{project.customer_name || "—"}</Row>
              {project.contact_person && project.contact_person !== project.customer_name ? <Row label="Contact">{project.contact_person}</Row> : null}
              <Row label="Phone">
                {phone ? (
                  <a href={phone.href} className="ops-peek-link">
                    <CountryFlag country={phone.country} /> {phone.text}
                  </a>
                ) : "—"}
              </Row>
              <Row label="Email">{project.contact_email ? <a href={`mailto:${project.contact_email}`} className="ops-peek-link">{project.contact_email}</a> : "—"}</Row>
              <Row label="Location">{location}</Row>
            </dl>
            <div className="ops-peek-next">
              <p className="ops-peek-next__label">Next action</p>
              <p className="ops-peek-next__text">{project.next_action || "None set"}</p>
              <p className="ops-peek-muted">{project.next_action_due ? `Due ${fmtDate(project.next_action_due)}` : "No due date"}{project.next_action_owner ? ` · ${project.next_action_owner}` : ""}</p>
            </div>
          </>
        ) : null}

        {tab === "financials" ? (
          <>
            <dl className="ops-peek-list">
              <Row label="Payment">{pay.label ? PAYMENT_LABEL_TEXT[pay.label] : "No Xero invoices yet"}</Row>
              <Row label="Invoiced">{formatOpsMoney(pay.invoiced)}</Row>
              <Row label="Paid">{formatOpsMoney(pay.paid)}{pay.pctPaid !== null && pay.label ? <span className="ops-peek-muted"> {pay.pctPaid}% paid</span> : null}</Row>
              <Row label="Owed now">{formatOpsMoney(pay.due)}{pay.overdue ? <span className="ops-peek-warn"> overdue</span> : null}</Row>
              {pay.notYetInvoiced !== null ? <Row label="Not yet invoiced">{formatOpsMoney(pay.notYetInvoiced)}</Row> : null}
              {pay.remainingOnQuote !== null ? <Row label="Remaining on quote">{formatOpsMoney(pay.remainingOnQuote)}</Row> : null}
              {pay.credited ? <Row label="Credited">{formatOpsMoney(pay.credited)}</Row> : null}
              <Row label="Invoices">{project.xero_invoice_numbers?.length ? project.xero_invoice_numbers.join(", ") : "—"}</Row>
              <Row label="Last Xero sync">{project.payment_synced_at ? formatOpsDateTime(project.payment_synced_at) : "Never"}</Row>
            </dl>
            <p className="ops-peek-muted">All amounts come from Xero and include VAT. Invoices never change the project value.</p>
            {!project.xero_quote_numbers?.length && project.xero_invoice_numbers?.length ? <p className="ops-peek-warn">Link the accepted quote to track what&apos;s still to invoice.</p> : null}
            <div className="ops-peek__actions">
              <AdminButton size="sm" variant="secondary" disabled={busy === "refresh"} onClick={() => void refresh()}>{busy === "refresh" ? "Refreshing…" : "Refresh from Xero"}</AdminButton>
              {onLinkXero ? <AdminButton size="sm" variant="ghost" onClick={onLinkXero}>Link to Xero</AdminButton> : null}
            </div>
            <div className="ops-peek-links">
              <QuoteFinder projectId={project.id} onLinked={() => setReload((n) => n + 1)} />
              <InvoiceCandidates projectId={project.id} />
            </div>
          </>
        ) : null}

        {tab === "operations" ? (
          <>
            <dl className="ops-peek-list">
              <Row label="Stage">{STAGE_LABELS[project.stage]}{project.on_hold && project.on_hold_reason ? ` (on hold: ${project.on_hold_reason})` : ""}</Row>
              <Row label="Project lead">{project.leadName ?? "—"}</Row>
              <Row label="Materials">{MATERIALS_ROLLUP_LABELS[project.materialsStatus]}{project.openOrders ? ` · ${project.openOrders} open order${project.openOrders === 1 ? "" : "s"}` : ""}</Row>
              <Row label="Planned dates">{project.scheduled_start ? `${fmtDate(project.scheduled_start)}${project.scheduled_end ? ` – ${fmtDate(project.scheduled_end)}` : ""}` : "Not scheduled"}</Row>
            </dl>
            {notes ? (
              <div className="ops-peek-next">
                <p className="ops-peek-next__label">Site address / notes</p>
                <p className="ops-peek-notes">{notes}</p>
              </div>
            ) : null}
            <div className="ops-peek__actions">
              <Link href={`/admin/operations/projects/${project.id}/?tab=materials`} className="admin-btn admin-btn--secondary admin-btn--sm">Supplier orders</Link>
              <Link href="/admin/operations/calendar/" className="admin-btn admin-btn--ghost admin-btn--sm">Calendar</Link>
            </div>
          </>
        ) : null}

        {tab === "documents" ? (
          <>
            <p className="ops-peek-next__label">Xero quotes</p>
            {quoteError ? <p className="ops-peek-warn">{quoteError}</p> : null}
            {quotes === null && !quoteError ? <p className="ops-peek-muted">Loading…</p> : null}
            {quotes?.length ? (
              <ul className="ops-peek-docs">
                {quotes.map((q) => (
                  <li key={q.quoteId ?? q.number}>
                    <span>
                      <strong>{q.number}</strong>
                      <span className="ops-peek-muted">
                        {[q.status, q.date ? fmtDate(q.date) : null, q.total !== null ? formatOpsMoney(q.total) : null, q.quoteId ? null : "number only"].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <button type="button" className="ops-sheet__text-btn" onClick={() => onViewQuote(q)}>View</button>
                  </li>
                ))}
              </ul>
            ) : quotes ? (
              <p className="ops-peek-muted">No Xero quote on this project.</p>
            ) : null}
            <p className="ops-peek-muted">Quotes are read live from Xero when you open them; no copies are stored.</p>
            <Link href={`/admin/operations/projects/${project.id}/?tab=files`} className="ops-sheet__text-btn">Project documents and links</Link>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function ProjectPeekDrawer({
  project,
  onClose,
  onPatched,
  leadSuggestions,
  onLinkXero,
}: {
  project: BoardProject | null;
  onClose: () => void;
  onPatched?: (p: BoardProject) => void;
  leadSuggestions: string[];
  onLinkXero?: () => void;
}) {
  const [mode, setMode] = useState<{ id: string; view: "overview" | "edit" | "quote"; quote?: ProjectQuoteRef } | null>(null);
  const view = mode && project && mode.id === project.id ? mode : { id: project?.id ?? "", view: "overview" as const };

  return (
    <AdminDrawer open={Boolean(project)} title={project?.title || "Project"} onClose={onClose}>
      {project ? (
        view.view === "edit" ? (
          <div className="ops-peek ops-peek--edit">
            <div className="ops-peek__actions">
              <AdminButton size="sm" variant="primary" onClick={() => setMode({ id: project.id, view: "overview" })}>Done editing</AdminButton>
              <span className="ops-peek-muted">Each field saves when you leave it.</span>
            </div>
            <PeekForm
              key={project.id}
              project={project}
              onPatched={onPatched}
              leadSuggestions={leadSuggestions}
              onLinkXero={onLinkXero}
            />
          </div>
        ) : view.view === "quote" && view.quote ? (
          <QuoteView projectId={project.id} quoteRef={view.quote} onBack={() => setMode({ id: project.id, view: "overview" })} />
        ) : (
          <ProjectOverview
            key={project.id}
            project={project}
            onEdit={() => setMode({ id: project.id, view: "edit" })}
            onViewQuote={(q) => setMode({ id: project.id, view: "quote", quote: q })}
            onLinkXero={onLinkXero}
            onPatched={onPatched}
          />
        )
      ) : null}
    </AdminDrawer>
  );
}
