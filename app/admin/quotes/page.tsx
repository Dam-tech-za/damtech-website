import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { listQuotes, sumPipelineValue, type QuoteListFilters } from "@/lib/quotes/list";
import { QUOTE_STATUSES, daysRemaining, formatQuoteNumber, normaliseQuoteStatus } from "@/lib/quotes/types";
import { formatZar } from "@/lib/estimating/money";
import { canViewCostMargin } from "@/lib/quotes/workflow";

type PageProps = { searchParams: Promise<QuoteListFilters> };

export default async function AdminQuotesPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const filters = await searchParams;
  const result = await listQuotes(filters);
  const showMargin = canViewCostMargin(admin.profile.role);
  const canExport = canPerform(admin.profile.role, "exportQuotes");

  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, company_name, contact_name")
    .order("company_name")
    .limit(500);
  const { data: staff } = await supabase
    .from("admin_profiles")
    .select("id, email, full_name")
    .eq("is_active", true)
    .order("email");

  const [sentValue, viewedValue, acceptedValue] = await Promise.all([
    sumPipelineValue(["sent"]),
    sumPipelineValue(["viewed"]),
    sumPipelineValue(["accepted"]),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="admin-quotes">
      <section className="admin-metric-grid" aria-label="Quote pipeline value">
        <article className="admin-metric-card">
          <p className="admin-metric-card__label">Sent value</p>
          <p className="admin-metric-card__value">{formatZar(sentValue)}</p>
          <p className="admin-metric-card__hint">Not revenue until accepted</p>
        </article>
        <article className="admin-metric-card">
          <p className="admin-metric-card__label">Viewed value</p>
          <p className="admin-metric-card__value">{formatZar(viewedValue)}</p>
          <p className="admin-metric-card__hint">Awaiting response</p>
        </article>
        <article className="admin-metric-card">
          <p className="admin-metric-card__label">Accepted value</p>
          <p className="admin-metric-card__value">{formatZar(acceptedValue)}</p>
          <p className="admin-metric-card__hint">Accepted ≠ cash received</p>
        </article>
      </section>

      <section className="admin-panel">
        <header className="admin-panel__header admin-panel__header--row">
          <div>
            <h2>Quotes</h2>
            <p className="admin-empty__hint">
              {result.total} latest revision{result.total === 1 ? "" : "s"}
            </p>
          </div>
          <div className="admin-panel__actions">
            {canExport ? (
              <Link
                className="btn btn--md btn--secondary"
                href={`/admin/quotes/export/?${new URLSearchParams(
                  Object.entries(filters)
                    .filter(([, v]) => Boolean(v))
                    .map(([k, v]) => [k, String(v)]),
                ).toString()}`}
              >
                Export CSV
              </Link>
            ) : null}
            {canPerform(admin.profile.role, "manageQuotes") ? (
              <Link className="btn btn--md btn--primary" href="/admin/quotes/new/">
                New quote
              </Link>
            ) : null}
          </div>
        </header>

        <form className="admin-filters" method="get">
          <input
            className="form-input"
            name="q"
            placeholder="Search quote, customer…"
            defaultValue={filters.q ?? ""}
          />
          <select name="status" className="form-input" defaultValue={filters.status ?? ""}>
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
          >
            <option value="">All customers</option>
            {(customers ?? []).map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.company_name || customer.contact_name}
              </option>
            ))}
          </select>
          <select name="assigned" className="form-input" defaultValue={filters.assigned ?? ""}>
            <option value="">Anyone assigned</option>
            <option value="unassigned">Unassigned</option>
            {(staff ?? []).map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name || person.email}
              </option>
            ))}
          </select>
          <input type="date" name="from" className="form-input" defaultValue={filters.from ?? ""} />
          <input type="date" name="to" className="form-input" defaultValue={filters.to ?? ""} />
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
          <button className="btn btn--md btn--secondary" type="submit">
            Filter
          </button>
        </form>

        {result.rows.length === 0 ? (
          <div className="admin-empty">
            <p>No quotes match these filters.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
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
                        <Link href={`/admin/quotes/${row.id}/`}>{display.label}</Link>
                      </td>
                      <td>{customerLabel}</td>
                      <td>{row.title}</td>
                      <td>{row.issue_date}</td>
                      <td>
                        {row.valid_until}
                        {remaining < 0 && ["sent", "viewed"].includes(status) ? (
                          <span className="admin-status admin-status--expired"> Expired</span>
                        ) : remaining <= 7 && ["sent", "viewed"].includes(status) ? (
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
                        <span className={`admin-status admin-status--${status}`}>
                          {status}
                        </span>
                      </td>
                      <td>{new Date(row.updated_at).toLocaleDateString("en-ZA")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <nav className="admin-pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const params = new URLSearchParams(
                Object.entries(filters)
                  .filter(([, v]) => Boolean(v))
                  .map(([k, v]) => [k, String(v)]),
              );
              params.set("page", String(page));
              return (
                <Link
                  key={page}
                  href={`/admin/quotes/?${params.toString()}`}
                  className={page === result.page ? "is-active" : undefined}
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
