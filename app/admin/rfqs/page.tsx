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
import {
  AdminEmptyState,
  AdminErrorState,
  AdminInfoBanner,
  AdminMetricCard,
  AdminMetricStrip,
  AdminPageHeader,
} from "@/components/admin/ui";

type PageProps = {
  searchParams: Promise<RfqListFilters>;
};

const STATUS_METRICS = [
  { key: "new", label: "New", tone: "info" as const },
  { key: "reviewing", label: "Reviewing", tone: "default" as const },
  {
    key: "information_required",
    label: "Info required",
    tone: "warning" as const,
  },
  {
    key: "site_measurement_required",
    label: "Site measure",
    tone: "warning" as const,
  },
  {
    key: "ready_for_quote",
    label: "Ready for quote",
    tone: "success" as const,
  },
  { key: "converted", label: "Converted", tone: "muted" as const },
] as const;

function filterParams(
  filters: RfqListFilters,
  omit: string[] = [],
): URLSearchParams {
  return new URLSearchParams(
    Object.entries(filters)
      .filter(([k, v]) => Boolean(v) && !omit.includes(k))
      .map(([k, v]) => [k, String(v)]),
  );
}

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
  const totalPages =
    result.totalPages ||
    Math.max(1, Math.ceil(result.total / result.pageSize));
  const exportHref = `/admin/rfqs/export/?${filterParams(filters).toString()}`;

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="RFQs"
        description="Review incoming requests and prepare complete quotations."
        primaryAction={
          canExport
            ? { href: exportHref, label: "Export" }
            : undefined
        }
      />

      <AdminInfoBanner tone="muted">
        Public website enquiries and calculator quote-preparation RFQs appear
        here after save. Quantities stay in their submitted units.
      </AdminInfoBanner>

      <AdminMetricStrip label="RFQ workflow summary">
        {STATUS_METRICS.map((card) => {
          const params = filterParams(filters, ["status", "page"]);
          params.set("status", card.key);
          return (
            <AdminMetricCard
              key={card.key}
              label={card.label}
              value={statusCounts[card.key] ?? 0}
              href={`/admin/rfqs/?${params.toString()}`}
              tone={card.tone}
            />
          );
        })}
      </AdminMetricStrip>

      <section className="admin-panel">
        <header className="admin-panel__header admin-panel__header--row">
          <div>
            <h2>Inbox</h2>
            <p className="admin-empty__hint">
              {result.total} record{result.total === 1 ? "" : "s"}
              {filters.status ? ` · filtered by ${filters.status}` : ""}
            </p>
          </div>
        </header>

        <form className="admin-filters" method="get">
          <input
            className="form-input"
            name="q"
            placeholder="RFQ, customer, company, email, phone, town, asset…"
            defaultValue={filters.q ?? ""}
            aria-label="Search RFQs"
          />
          <select
            name="status"
            className="form-input"
            defaultValue={filters.status ?? ""}
            aria-label="Status"
          >
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
            aria-label="Asset type"
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
            aria-label="Material preference"
          />
          <select
            name="measurementMethod"
            className="form-input"
            defaultValue={filters.measurementMethod ?? ""}
            aria-label="Measurement method"
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
            aria-label="Measurement required"
          >
            <option value="">Measurement required: any</option>
            <option value="1">Site measurement required</option>
          </select>
          <select
            name="service"
            className="form-input"
            defaultValue={filters.service ?? ""}
            aria-label="Service"
          >
            <option value="">All services</option>
            {SERVICE_OPTIONS.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
          <select
            name="province"
            className="form-input"
            defaultValue={filters.province ?? ""}
            aria-label="Province"
          >
            <option value="">All provinces</option>
            {PROVINCE_OPTIONS.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
          <select
            name="assigned"
            className="form-input"
            defaultValue={filters.assigned ?? ""}
            aria-label="Assigned estimator"
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
            aria-label="Submitted from"
          />
          <input
            type="date"
            name="to"
            className="form-input"
            defaultValue={filters.to ?? ""}
            aria-label="Submitted to"
          />
          <select
            name="hasCalculator"
            className="form-input"
            defaultValue={filters.hasCalculator ?? ""}
            aria-label="Calculator data"
          >
            <option value="">Calculator inputs: any</option>
            <option value="1">Has calculator / assets</option>
            <option value="0">No calculator</option>
          </select>
          <select
            name="hasDrawings"
            className="form-input"
            defaultValue={filters.hasDrawings ?? ""}
            aria-label="Drawings"
          >
            <option value="">Drawings: any</option>
            <option value="1">Has drawings</option>
          </select>
          <select
            name="hasAttachments"
            className="form-input"
            defaultValue={filters.hasAttachments ?? ""}
            aria-label="Attachments"
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
            aria-label="Minimum material area"
          />
          <input
            className="form-input"
            name="maxMaterialArea"
            type="number"
            step="any"
            placeholder="Max material m²"
            defaultValue={filters.maxMaterialArea ?? ""}
            aria-label="Maximum material area"
          />
          <input
            className="form-input"
            name="minTankCapacity"
            type="number"
            step="any"
            placeholder="Min tank kL"
            defaultValue={filters.minTankCapacity ?? ""}
            aria-label="Minimum tank capacity"
          />
          <input
            className="form-input"
            name="maxTankCapacity"
            type="number"
            step="any"
            placeholder="Max tank kL"
            defaultValue={filters.maxTankCapacity ?? ""}
            aria-label="Maximum tank capacity"
          />
          <select
            name="sort"
            className="form-input"
            defaultValue={filters.sort ?? "submitted_at_desc"}
            aria-label="Sort order"
          >
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
        <AdminErrorState
          title="Unable to load RFQs"
          message="Please retry shortly. If the problem continues, check system health."
        />
      ) : result.rows.length === 0 ? (
        <AdminEmptyState
          title="No RFQs match the selected filters."
          description="Try clearing filters, or wait for the next website or calculator submission."
          actionHref="/admin/rfqs/"
          actionLabel="Clear filters"
        />
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
            const params = filterParams(filters);
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
