import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import {
  daysRemaining,
  formatQuoteNumber,
  isQuoteExpiredByDate,
  normaliseQuoteStatus,
} from "@/lib/quotes/types";
import { formatZar } from "@/lib/estimating/money";
import {
  canApproveQuote,
  canCreateRevision,
  canEditQuote,
  canSendQuote,
  canViewCostMargin,
} from "@/lib/quotes/workflow";
import { QuoteActionsClient } from "@/components/admin/QuoteActionsClient";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminQuoteDetailPage({ params }: PageProps) {
  const admin = await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, customers(company_name, contact_name, email)")
    .eq("id", id)
    .maybeSingle();

  if (!quote) notFound();

  const [{ data: lines }, { data: events }, { data: comms }, { data: revisions }] =
    await Promise.all([
      supabase
        .from("quote_line_items")
        .select("*")
        .eq("quote_id", id)
        .order("sort_order"),
      supabase
        .from("quote_events")
        .select("*")
        .eq("quote_id", id)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("quote_communications")
        .select("*")
        .eq("quote_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("quotes")
        .select("id, revision_number, status, total_inc_vat, created_at")
        .eq("quote_number", quote.quote_number)
        .order("revision_number", { ascending: false }),
    ]);

  const status = normaliseQuoteStatus(quote.status);
  const display = formatQuoteNumber(quote.quote_number, quote.revision_number ?? 0);
  const remaining = daysRemaining(quote.valid_until);
  const expired = isQuoteExpiredByDate(quote.valid_until, status);
  const showCost = canViewCostMargin(admin.profile.role);

  return (
    <div className="admin-quote-detail">
      <section className="admin-panel">
        <header className="admin-panel__header admin-panel__header--row">
          <div>
            <h2>{display.label}</h2>
            <p className="admin-empty__hint">{quote.title}</p>
            <p>
              <span className={`admin-status admin-status--${status}`}>{status}</span>
              {expired ? (
                <span className="admin-status admin-status--expired"> Expired</span>
              ) : remaining <= 7 && ["sent", "viewed"].includes(status) ? (
                <span className="admin-status admin-status--reviewing">
                  {" "}
                  Expires in {remaining} day{remaining === 1 ? "" : "s"}
                </span>
              ) : null}
            </p>
          </div>
          <div className="admin-panel__actions">
            {canEditQuote(status, admin.profile.role) ? (
              <Link className="btn btn--md btn--secondary" href={`/admin/quotes/${id}/edit/`}>
                Edit
              </Link>
            ) : null}
            <Link className="btn btn--md btn--secondary" href={`/admin/quotes/${id}/preview/`}>
              PDF preview
            </Link>
            <Link className="btn btn--md btn--secondary" href={`/admin/quotes/${id}/revisions/`}>
              Revisions
            </Link>
          </div>
        </header>

        <dl className="admin-definition-list">
          <div>
            <dt>Customer</dt>
            <dd>
              {quote.customers?.company_name ||
                quote.company_name ||
                quote.contact_name ||
                "—"}
              {quote.customer_id ? (
                <>
                  {" "}
                  · <Link href={`/admin/customers/${quote.customer_id}/`}>Open</Link>
                </>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>RFQ</dt>
            <dd>
              {quote.rfq_id ? (
                <Link href={`/admin/rfqs/${quote.rfq_id}/`}>{quote.rfq_id.slice(0, 8)}…</Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt>Issue / valid until</dt>
            <dd>
              {quote.issue_date} → {quote.valid_until}
            </dd>
          </div>
          <div>
            <dt>Total inc VAT</dt>
            <dd>{formatZar(Number(quote.total_inc_vat))}</dd>
          </div>
          {showCost ? (
            <>
              <div>
                <dt>Direct cost</dt>
                <dd>{formatZar(Number(quote.direct_cost ?? 0))}</dd>
              </div>
              <div>
                <dt>Gross margin</dt>
                <dd>
                  {quote.gross_margin_percent != null
                    ? `${Number(quote.gross_margin_percent).toFixed(1)}%`
                    : "—"}
                </dd>
              </div>
            </>
          ) : null}
          <div>
            <dt>Acceptance</dt>
            <dd>
              {quote.accepted_at
                ? `Accepted ${new Date(quote.accepted_at).toLocaleString("en-ZA")}`
                : quote.rejected_at
                  ? `Rejected ${new Date(quote.rejected_at).toLocaleString("en-ZA")}`
                  : "Pending"}
            </dd>
          </div>
        </dl>

        <QuoteActionsClient
          quoteId={id}
          status={status}
          email={quote.email ?? ""}
          canApprove={canApproveQuote(admin.profile.role)}
          canSend={canSendQuote(status, admin.profile.role) || admin.profile.role === "owner"}
          canRevise={canCreateRevision(status, admin.profile.role)}
          isOwner={admin.profile.role === "owner"}
          hasPdf={Boolean(quote.pdf_storage_path)}
        />
      </section>

      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>Line items</h2>
        </header>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                {showCost ? <th>Cost</th> : null}
                <th>Sell</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(lines ?? []).map((line) => (
                <tr key={line.id}>
                  <td>{line.item_code || "—"}</td>
                  <td>{line.description}</td>
                  <td>{line.quantity}</td>
                  <td>{line.unit}</td>
                  {showCost ? (
                    <td>
                      {line.cost_unit_price != null
                        ? formatZar(Number(line.cost_unit_price))
                        : "—"}
                    </td>
                  ) : null}
                  <td>{formatZar(Number(line.sell_unit_price))}</td>
                  <td>{formatZar(Number(line.line_total_ex_vat))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-dashboard-panels">
        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Events</h2>
          </header>
          <ul className="admin-list">
            {(events ?? []).map((event) => (
              <li key={event.id}>
                {event.event_type} · {event.actor_type} ·{" "}
                {new Date(event.created_at).toLocaleString("en-ZA")}
              </li>
            ))}
          </ul>
        </section>
        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Communications</h2>
          </header>
          <ul className="admin-list">
            {(comms ?? []).length === 0 ? (
              <li>No emails recorded.</li>
            ) : (
              (comms ?? []).map((row) => (
                <li key={row.id}>
                  {row.communication_type} → {row.recipient_email} · {row.status}
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Revisions</h2>
          </header>
          <ul className="admin-list">
            {(revisions ?? []).map((rev) => (
              <li key={rev.id}>
                <Link href={`/admin/quotes/${rev.id}/`}>
                  Rev {rev.revision_number}
                </Link>{" "}
                · {normaliseQuoteStatus(rev.status)} ·{" "}
                {formatZar(Number(rev.total_inc_vat))}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
