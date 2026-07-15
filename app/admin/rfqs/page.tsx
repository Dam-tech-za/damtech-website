import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { SERVICE_OPTIONS, PROVINCE_OPTIONS } from "@/lib/form";
import { RFQ_STATUSES } from "@/lib/rfq/schema";
import { RFQ_ASSET_TYPES, MEASUREMENT_METHODS } from "@/lib/rfq/public-schema";
import {
  getRfqStatusCounts,
  listRfqs,
  rfqSizeLabel,
  type RfqListFilters,
} from "@/lib/rfq/list";
import { bulkUpdateRfqStatusAction } from "./actions";
import { RfqInboxClient } from "@/components/admin/RfqInboxClient";

type PageProps = {
  searchParams: Promise<RfqListFilters>;
};

const STATUS_CARDS = [
  { key: "new", label: "New" },
  { key: "reviewing", label: "Reviewing" },
  { key: "site_measurement_required", label: "Site measurement required" },
  { key: "information_required", label: "Information required" },
  { key: "ready_for_quote", label: "Ready for quote" },
  { key: "converted", label: "Converted" },
  { key: "closed", label: "Closed" },
] as const;

export default async function AdminRfqsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const filters = await searchParams;
  const [result, statusCounts] = await Promise.all([
    listRfqs(filters),
    getRfqStatusCounts(),
  ]);
  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("admin_profiles")
    .select("id, email, full_name")
    .eq("is_active", true)
    .order("email");

  const canExport = canPerform(admin.profile.role, "exportRfqs");
  const totalPages = result.totalPages || Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="admin-rfq-inbox">
      <section className="admin-metric-grid" aria-label="RFQ status summary">
        {STATUS_CARDS.map((card) => {
          const params = new URLSearchParams(
            Object.entries(filters)
              .filter(([k, v]) => Boolean(v) && k !== "status" && k !== "page")
              .map(([k, v]) => [k, String(v)]),
          );
          params.set("status", card.key);
          return (
            <Link
              key={card.key}
              href={`/admin/rfqs/?${params.toString()}`}
              className={`admin-metric-card admin-metric-card--link${filters.status === card.key ? " is-active" : ""}`}
            >
              <p className="admin-metric-card__label">{card.label}</p>
              <p className="admin-metric-card__value">
                {statusCounts[card.key] ?? 0}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="admin-panel">
        <header className="admin-panel__header admin-panel__header--row">
          <div>
            <h2>RFQ inbox</h2>
            <p className="admin-empty__hint">
              {result.total} record{result.total === 1 ? "" : "s"} · URL filters ·
              quantities stay in separate units
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
            placeholder="RFQ, customer, company, email, phone, town, asset…"
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
          <select
            name="assetType"
            className="form-input"
            defaultValue={filters.assetType ?? ""}
          >
            <option value="">All asset types</option>
            {RFQ_ASSET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input
            className="form-input"
            name="materialPreference"
            placeholder="Material preference"
            defaultValue={filters.materialPreference ?? ""}
          />
          <select
            name="measurementMethod"
            className="form-input"
            defaultValue={filters.measurementMethod ?? ""}
          >
            <option value="">Measurement method</option>
            {MEASUREMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select
            name="measurementRequired"
            className="form-input"
            defaultValue={filters.measurementRequired ?? ""}
          >
            <option value="">Measurement required: any</option>
            <option value="1">Site measurement required</option>
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
            <option value="">Calculator inputs: any</option>
            <option value="1">Has calculator / assets</option>
            <option value="0">No calculator</option>
          </select>
          <select
            name="hasDrawings"
            className="form-input"
            defaultValue={filters.hasDrawings ?? ""}
          >
            <option value="">Drawings: any</option>
            <option value="1">Has drawings</option>
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
            name="minMaterialArea"
            type="number"
            step="any"
            placeholder="Min material m²"
            defaultValue={filters.minMaterialArea ?? ""}
          />
          <input
            className="form-input"
            name="maxMaterialArea"
            type="number"
            step="any"
            placeholder="Max material m²"
            defaultValue={filters.maxMaterialArea ?? ""}
          />
          <input
            className="form-input"
            name="minTankCapacity"
            type="number"
            step="any"
            placeholder="Min tank kL"
            defaultValue={filters.minTankCapacity ?? ""}
          />
          <input
            className="form-input"
            name="maxTankCapacity"
            type="number"
            step="any"
            placeholder="Max tank kL"
            defaultValue={filters.maxTankCapacity ?? ""}
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
              Public `/quote/` simple submissions and calculator quote-preparation
              RFQs appear here immediately after save.
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
