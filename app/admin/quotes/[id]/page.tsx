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
import {
  AdminButton,
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
  AdminTable,
  AdminTabs,
} from "@/components/admin/ui";

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
  const grossProfit =
    Number(quote.total_ex_vat ?? 0) - Number(quote.direct_cost ?? 0);
  const markupPercent =
    quote.direct_cost && Number(quote.direct_cost) > 0
      ? ((Number(quote.total_ex_vat ?? 0) - Number(quote.direct_cost)) /
          Number(quote.direct_cost)) *
        100
      : null;

  const tabItems = [
    { id: "overview", label: "Overview", href: "#quote-overview" },
    { id: "lines", label: "Line items", href: "#quote-lines" },
    ...(showCost
      ? [{ id: "costing", label: "Costing", href: "#quote-costing" }]
      : []),
    { id: "pdf", label: "PDF", href: "#quote-pdf" },
    { id: "comms", label: "Communications", href: "#quote-comms" },
    { id: "activity", label: "Activity", href: "#quote-activity" },
    { id: "revisions", label: "Revisions", href: "#quote-revisions" },
  ];

  return (
    <div className="admin-quote-detail admin-stack--page">
      <AdminPageHeader
        title={display.label}
        description={`${quote.title || "Customer quotation"} · Valid until ${quote.valid_until} · ${formatZar(Number(quote.total_inc_vat))}`}
        toolbar={
          <>
            <AdminStatusBadge status={status} />
            {expired ? <AdminStatusBadge status="expired" label="Expired" /> : null}
            {!expired && remaining <= 7 && ["sent", "viewed"].includes(status) ? (
              <AdminStatusBadge
                status="reviewing"
                label={`Expires in ${remaining} day${remaining === 1 ? "" : "s"}`}
              />
            ) : null}
          </>
        }
        secondaryActions={
          <>
            <AdminButton href={`/admin/quotes/${id}/preview/`} variant="secondary">
              Preview PDF
            </AdminButton>
            <AdminButton href={`/admin/quotes/${id}/revisions/`} variant="secondary">
              Revisions
            </AdminButton>
          </>
        }
        primaryAction={
          canEditQuote(status, admin.profile.role)
            ? { href: `/admin/quotes/${id}/edit/`, label: "Edit", variant: "primary" }
            : undefined
        }
      />

      <AdminTabs items={tabItems} activeId="" />

      <AdminPanel id="quote-overview" title="Overview">
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
            <dt>Project</dt>
            <dd>{quote.title || quote.project_reference || "—"}</dd>
          </div>
          <div>
            <dt>RFQ</dt>
            <dd>
              {quote.rfq_id ? (
                <Link href={`/admin/rfqs/${quote.rfq_id}/`}>
                  {quote.rfq_id.slice(0, 8)}…
                </Link>
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
          <div>
            <dt>Internal notes</dt>
            <dd>{quote.internal_notes || "—"}</dd>
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
      </AdminPanel>

      <AdminPanel id="quote-lines" title="Line items">
        {(lines ?? []).length === 0 ? (
          <AdminEmptyState title="No line items" compact />
        ) : (
          <AdminTable>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Unit rate</th>
                {showCost ? <th>Cost</th> : null}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(lines ?? []).map((line) => (
                <tr key={line.id}>
                  <td>
                    {line.item_code ? `${line.item_code} · ` : ""}
                    {line.description}
                  </td>
                  <td>{line.quantity}</td>
                  <td>{line.unit}</td>
                  <td>{formatZar(Number(line.sell_unit_price))}</td>
                  {showCost ? (
                    <td>
                      {line.cost_unit_price != null
                        ? formatZar(Number(line.cost_unit_price))
                        : "—"}
                    </td>
                  ) : null}
                  <td>{formatZar(Number(line.line_total_ex_vat))}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminPanel>

      {showCost ? (
        <AdminPanel id="quote-costing" title="Costing">
          <div className="admin-metric-strip admin-metric-strip--inline">
            <AdminMetricCard
              label="Direct cost"
              value={formatZar(Number(quote.direct_cost ?? 0))}
              tone="default"
            />
            <AdminMetricCard
              label="Selling price"
              value={formatZar(Number(quote.total_ex_vat ?? 0))}
              tone="info"
            />
            <AdminMetricCard
              label="Gross profit"
              value={formatZar(grossProfit)}
              tone="success"
            />
            <AdminMetricCard
              label="Gross margin"
              value={
                quote.gross_margin_percent != null
                  ? `${Number(quote.gross_margin_percent).toFixed(1)}%`
                  : "—"
              }
              tone="default"
            />
            <AdminMetricCard
              label="Markup"
              value={markupPercent != null ? `${markupPercent.toFixed(1)}%` : "—"}
              tone="default"
            />
            <AdminMetricCard
              label="VAT"
              value={formatZar(Number(quote.vat_amount ?? 0))}
              tone="muted"
            />
          </div>
        </AdminPanel>
      ) : null}

      <AdminPanel
        id="quote-pdf"
        title="PDF"
        actions={
          <>
            <AdminButton href={`/admin/quotes/${id}/preview/`} variant="secondary" size="sm">
              Preview
            </AdminButton>
            {quote.pdf_storage_path ? (
              <AdminButton href={`/admin/quotes/${id}/preview/`} variant="primary" size="sm">
                Open PDF
              </AdminButton>
            ) : null}
          </>
        }
      >
        {quote.pdf_storage_path ? (
          <p className="admin-help-text">
            PDF generated. Use Preview to review before sending to the customer.
          </p>
        ) : (
          <AdminEmptyState
            title="No PDF generated yet"
            description="Generate a PDF from the quote actions above or preview layout."
            actionHref={`/admin/quotes/${id}/preview/`}
            actionLabel="Preview layout"
            compact
          />
        )}
      </AdminPanel>

      <div className="admin-dashboard-panels">
        <AdminPanel id="quote-comms" title="Communications">
          {(comms ?? []).length === 0 ? (
            <AdminEmptyState title="No communications recorded" compact />
          ) : (
            <ol className="admin-timeline">
              {(comms ?? []).map((row) => (
                <li key={row.id}>
                  <strong>{row.communication_type}</strong>
                  <span className="admin-muted">
                    {" "}
                    → {row.recipient_email} · {row.status} ·{" "}
                    {new Date(row.created_at).toLocaleString("en-ZA")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </AdminPanel>

        <AdminPanel id="quote-activity" title="Activity">
          {(events ?? []).length === 0 ? (
            <AdminEmptyState title="No activity yet" compact />
          ) : (
            <ol className="admin-timeline">
              {(events ?? []).map((event) => (
                <li key={event.id}>
                  <strong>{event.event_type}</strong>
                  <span className="admin-muted">
                    {" "}
                    · {event.actor_type} ·{" "}
                    {new Date(event.created_at).toLocaleString("en-ZA")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </AdminPanel>

        <AdminPanel id="quote-revisions" title="Revisions">
          {(revisions ?? []).length === 0 ? (
            <AdminEmptyState title="No revisions" compact />
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  <th>Revision</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {(revisions ?? []).map((rev) => (
                  <tr key={rev.id}>
                    <td>
                      <Link href={`/admin/quotes/${rev.id}/`}>
                        Rev {rev.revision_number}
                      </Link>
                    </td>
                    <td>
                      <AdminStatusBadge status={normaliseQuoteStatus(rev.status)} />
                    </td>
                    <td>{formatZar(Number(rev.total_inc_vat))}</td>
                    <td>
                      {new Date(rev.created_at).toLocaleDateString("en-ZA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
