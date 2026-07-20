import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  getQuoteStatusCounts,
  listQuotes,
  sumPipelineValue,
  type QuoteListFilters,
} from "@/lib/quotes/list";
import {
  QUOTE_STATUSES,
  daysRemaining,
  formatQuoteNumber,
  normaliseQuoteStatus,
} from "@/lib/quotes/types";
import { formatZar } from "@/lib/estimating/money";
import { canViewCostMargin } from "@/lib/quotes/workflow";
import {
  AdminButton,
  AdminEmptyState,
  AdminInfoBanner,
  AdminMetricCard,
  AdminMetricStrip,
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/ui";

type PageProps = { searchParams: Promise<QuoteListFilters> };

const STATUS_METRICS = [
  { key: "draft", label: "Draft", tone: "muted" as const },
  { key: "internal_review", label: "Awaiting approval", tone: "warning" as const },
  { key: "sent", label: "Sent", tone: "info" as const },
  { key: "viewed", label: "Viewed", tone: "default" as const },
  { key: "accepted", label: "Accepted", tone: "success" as const },
  { key: "expiring_soon", label: "Expiring soon", tone: "warning" as const },
] as const;

function filterParams(
  filters: QuoteListFilters,
  omit: string[] = [],
): URLSearchParams {
  return new URLSearchParams(
    Object.entries(filters)
      .filter(([k, v]) => Boolean(v) && !omit.includes(k))
      .map(([k, v]) => [k, String(v)]),
  );
}

export default async function AdminQuotesPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const filters = await searchParams;
  const showMargin = canViewCostMargin(admin.profile.role);
  const canExport = canPerform(admin.profile.role, "exportQuotes");
  const canManage = canPerform(admin.profile.role, "manageQuotes");

  const [result, statusCounts, sentValue, viewedValue, acceptedValue] =
    await Promise.all([
      listQuotes(filters),
      getQuoteStatusCounts(),
      sumPipelineValue(["sent"]),
      sumPipelineValue(["viewed"]),
      sumPipelineValue(["accepted"]),
    ]);

  const supabase = await createClient();
  const [{ data: customers }, { data: staff }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, company_name, contact_name")
      .order("company_name")
      .limit(500),
    supabase
      .from("admin_profiles")
      .select("id, email, full_name")
      .eq("is_active", true)
      .order("email"),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const exportHref = `/admin/quotes/export/?${filterParams(filters).toString()}`;

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Quotes"
        description="Create, approve, send and track customer quotations."
        primaryAction={
          canManage
            ? { href: "/admin/quotes/new/", label: "New Quote" }
            : undefined
        }
        secondaryAction={
          canExport
            ? { href: exportHref, label: "Export", variant: "secondary" }
            : undefined
        }
      />

      <AdminInfoBanner tone="muted">
        Pipeline values below are quotation totals, not cash received. Accepted
        does not mean paid.
      </AdminInfoBanner>

      <AdminMetricStrip label="Quote workflow summary">
        {STATUS_METRICS.map((card) => {
          const params = filterParams(filters, ["status", "page", "expiring"]);
          if (card.key === "expiring_soon") {
            params.set("expiring", "1");
          } else {
            params.set("status", card.key);
          }
          return (
            <AdminMetricCard
              key={card.key}
              label={card.label}
              value={statusCounts[card.key] ?? 0}
              href={`/admin/quotes/?${params.toString()}`}
              tone={card.tone}
            />
          );
        })}
      </AdminMetricStrip>

      <AdminMetricStrip label="Pipeline value">
        <AdminMetricCard
          label="Sent value"
          value={formatZar(sentValue)}
          hint="Awaiting customer"
          tone="info"
        />
        <AdminMetricCard
          label="Viewed value"
          value={formatZar(viewedValue)}
          hint="No response yet"
          tone="default"
        />
        <AdminMetricCard
          label="Accepted value"
          value={formatZar(acceptedValue)}
          hint="Not cash received"
          tone="success"
        />
      </AdminMetricStrip>

      <section className="admin-panel">
        <header className="admin-panel__header admin-panel__header--row">
          <div>
            <h2>Quotations</h2>
            <p className="admin-empty__hint">
              {result.total} latest revision{result.total === 1 ? "" : "s"}
            </p>
          </div>
        </header>

        <form className="admin-filters" method="get">
          <input
            className="form-input"
            name="q"
            placeholder="Search quote, customer…"
            defaultValue={filters.q ?? ""}
            aria-label="Search quotes"
          />
          <select
            name="status"
            className="form-input"
            defaultValue={filters.status ?? ""}
            aria-label="Status"
          >
            <option value="">All statuses</option>
            {QUOTE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            name="customerId"
            className="form-input"
            defaultValue={filters.customerId ?? ""}
            aria-label="Customer"
          >
            <option value="">All customers</option>
            {(customers ?? []).map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.company_name || customer.contact_name}
              </option>
            ))}
          </select>
          <select
            name="assigned"
            className="form-input"
            defaultValue={filters.assigned ?? ""}
            aria-label="Assigned owner"
          >
            <option value="">Anyone assigned</option>
            <option value="unassigned">Unassigned</option>
            {(staff ?? []).map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name || person.email}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="from"
            className="form-input"
            defaultValue={filters.from ?? ""}
            aria-label="Issue date from"
          />
          <input
            type="date"
            name="to"
            className="form-input"
            defaultValue={filters.to ?? ""}
            aria-label="Issue date to"
          />
          <label className="admin-field">
            <span>
              <input
                type="checkbox"
                name="expiring"
                value="1"
                defaultChecked={filters.expiring === "1"}
              />{" "}
              Expiring soon
            </span>
          </label>
          <AdminButton type="submit" variant="primary">
            Apply filters
          </AdminButton>
          <AdminButton href="/admin/quotes/" variant="secondary">
            Clear
          </AdminButton>
        </form>

        {result.rows.length === 0 ? (
          <AdminEmptyState
            title="No quotations match the selected filters."
            description="Create a quote from an RFQ or start a blank quotation."
            actionHref={canManage ? "/admin/quotes/new/" : undefined}
            actionLabel={canManage ? "New Quote" : undefined}
          />
        ) : (
          <AdminTable>
            <thead>
              <tr>
                <th>Quote</th>
                <th>Customer</th>
                <th>Project</th>
                <th>Issue</th>
                <th>Valid until</th>
                <th>Total</th>
                {showMargin ? <th>Margin</th> : null}
                <th>Status</th>
                <th>Updated</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => {
                const status = normaliseQuoteStatus(row.status);
                const remaining = daysRemaining(row.valid_until);
                const display = formatQuoteNumber(
                  row.quote_number,
                  row.revision_number ?? 0,
                );
                const customerLabel =
                  row.customers?.company_name ||
                  row.company_name ||
                  row.customers?.contact_name ||
                  row.contact_name ||
                  "—";
                return (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/admin/quotes/${row.id}/`}>
                        {display.label}
                      </Link>
                    </td>
                    <td>{customerLabel}</td>
                    <td>{row.title}</td>
                    <td>{row.issue_date}</td>
                    <td>
                      {row.valid_until}
                      {remaining < 0 &&
                      ["sent", "viewed"].includes(status) ? (
                        <span className="admin-status admin-status--expired">
                          {" "}
                          Expired
                        </span>
                      ) : remaining <= 7 &&
                        ["sent", "viewed"].includes(status) ? (
                        <span className="admin-status admin-status--reviewing">
                          {" "}
                          {remaining}d left
                        </span>
                      ) : null}
                    </td>
                    <td>{formatZar(Number(row.total_inc_vat))}</td>
                    {showMargin ? (
                      <td>
                        {row.gross_margin_percent != null
                          ? `${Number(row.gross_margin_percent).toFixed(1)}%`
                          : "—"}
                      </td>
                    ) : null}
                    <td>
                      <AdminStatusBadge status={status} domain="quote" />
                    </td>
                    <td>
                      {new Date(row.updated_at).toLocaleDateString("en-ZA")}
                    </td>
                    <td>
                      <AdminButton
                        href={`/admin/quotes/${row.id}/`}
                        size="sm"
                        variant="secondary"
                      >
                        Open
                      </AdminButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
        )}

        {totalPages > 1 ? (
          <nav className="admin-pagination" aria-label="Quote pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const params = filterParams(filters);
              params.set("page", String(page));
              return (
                <Link
                  key={page}
                  href={`/admin/quotes/?${params.toString()}`}
                  className={`admin-pagination__link${page === result.page ? " is-active" : ""}`}
                >
                  {page}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
