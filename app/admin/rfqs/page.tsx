import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { SERVICE_OPTIONS, PROVINCE_OPTIONS } from "@/lib/form";
import { RFQ_STATUSES } from "@/lib/rfq/schema";
import { listRfqs, rfqSizeLabel, type RfqListFilters } from "@/lib/rfq/list";
import {
  bulkUpdateRfqStatusAction,
} from "./actions";
import { RfqInboxClient } from "@/components/admin/RfqInboxClient";

type PageProps = {
  searchParams: Promise<RfqListFilters>;
};

export default async function AdminRfqsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const filters = await searchParams;
  const result = await listRfqs(filters);
  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("admin_profiles")
    .select("id, email, full_name")
    .eq("is_active", true)
    .order("email");

  const canExport = canPerform(admin.profile.role, "exportRfqs");
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="admin-rfq-inbox">
      <section className="admin-panel">
        <header className="admin-panel__header admin-panel__header--row">
          <div>
            <h2>RFQ inbox</h2>
            <p className="admin-empty__hint">
              {result.total} record{result.total === 1 ? "" : "s"} · filters sync
              to the URL
            </p>
          </div>
          {canExport ? (
            <Link
              className="btn btn--md btn--secondary"
              href={`/admin/rfqs/export/?${new URLSearchParams(
                Object.entries(filters)
                  .filter(([, v]) => Boolean(v))
                  .map(([k, v]) => [k, String(v)]),
              ).toString()}`}
            >
              Export CSV
            </Link>
          ) : null}
        </header>

        <form className="admin-filters" method="get">
          <input
            className="form-input"
            name="q"
            placeholder="Search RFQ, customer, email, phone…"
            defaultValue={filters.q ?? ""}
          />
          <select name="status" className="form-input" defaultValue={filters.status ?? ""}>
            <option value="">All statuses</option>
            {RFQ_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select name="service" className="form-input" defaultValue={filters.service ?? ""}>
            <option value="">All services</option>
            {SERVICE_OPTIONS.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
          <select name="province" className="form-input" defaultValue={filters.province ?? ""}>
            <option value="">All provinces</option>
            {PROVINCE_OPTIONS.map((province) => (
              <option key={province} value={province}>
                {province}
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
          <select
            name="hasCalculator"
            className="form-input"
            defaultValue={filters.hasCalculator ?? ""}
          >
            <option value="">Calculator: any</option>
            <option value="1">Has calculator</option>
            <option value="0">No calculator</option>
          </select>
          <select
            name="hasAttachments"
            className="form-input"
            defaultValue={filters.hasAttachments ?? ""}
          >
            <option value="">Attachments: any</option>
            <option value="1">Has attachments</option>
            <option value="0">No attachments</option>
          </select>
          <input
            className="form-input"
            name="sourcePage"
            placeholder="Source page"
            defaultValue={filters.sourcePage ?? ""}
          />
          <select name="sort" className="form-input" defaultValue={filters.sort ?? "submitted_at_desc"}>
            <option value="submitted_at_desc">Newest submitted</option>
            <option value="submitted_at_asc">Oldest submitted</option>
            <option value="updated_at_desc">Recently updated</option>
            <option value="rfq_number_asc">RFQ number</option>
          </select>
          <button type="submit" className="btn btn--md btn--primary">
            Apply filters
          </button>
          <Link href="/admin/rfqs/" className="btn btn--md btn--secondary">
            Clear
          </Link>
        </form>
      </section>

      {result.error ? (
        <div className="admin-panel">
          <div className="admin-empty">
            <p>Unable to load RFQs.</p>
            <p className="admin-empty__hint">{result.error}</p>
          </div>
        </div>
      ) : result.rows.length === 0 ? (
        <div className="admin-panel">
          <div className="admin-empty">
            <p>No RFQs match these filters.</p>
            <p className="admin-empty__hint">
              Public quote/contact submissions appear here once Supabase Phase 2
              migrations are applied.
            </p>
          </div>
        </div>
      ) : (
        <RfqInboxClient
          rows={result.rows.map((row) => ({
            ...row,
            sizeLabel: rfqSizeLabel(row),
          }))}
          bulkAction={bulkUpdateRfqStatusAction}
        />
      )}

      {totalPages > 1 ? (
        <nav className="admin-pagination" aria-label="RFQ pages">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams(
              Object.entries(filters)
                .filter(([, v]) => Boolean(v))
                .map(([k, v]) => [k, String(v)]),
            );
            params.set("page", String(p));
            return (
              <Link
                key={p}
                href={`/admin/rfqs/?${params.toString()}`}
                className={`admin-pagination__link${p === result.page ? " is-active" : ""}`}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
